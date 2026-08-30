import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "apps", "api");
const webDir = path.join(root, "apps", "web");

function run(command, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} stopped (${signal})`));
        return;
      }
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function runSilent(command, args, cwd = root) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.on("exit", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureEnv() {
  const apiEnv = path.join(apiDir, ".env");
  if (!existsSync(apiEnv)) {
    writeFileSync(
      apiEnv,
      [
        'DATABASE_URL="postgresql://finpilot:finpilot@localhost:5432/finpilot"',
        'JWT_ACCESS_SECRET="dev-access-secret-change-me-32chars"',
        'JWT_REFRESH_SECRET="dev-refresh-secret-change-me-32ch"',
        "PORT=4000",
        'CLIENT_ORIGIN="http://localhost:3000"',
        "",
      ].join("\n"),
    );
    console.log("Created apps/api/.env");
  }

  const webEnv = path.join(webDir, ".env.local");
  if (!existsSync(webEnv)) {
    writeFileSync(webEnv, "API_INTERNAL_URL=http://localhost:4000\n");
    console.log("Created apps/web/.env.local");
  }
}

async function waitForPostgres() {
  console.log("Waiting for Postgres...");
  for (let i = 0; i < 40; i++) {
    const ok = await runSilent("docker", [
      "compose",
      "exec",
      "-T",
      "postgres",
      "pg_isready",
      "-U",
      "finpilot",
      "-d",
      "finpilot",
    ]);
    if (ok) {
      console.log("Postgres is ready.");
      return;
    }
    await sleep(1500);
  }
  throw new Error(
    "Postgres did not become ready. Start Docker Desktop, then run this command again.",
  );
}

async function main() {
  process.chdir(root);
  ensureEnv();

  if (!existsSync(path.join(root, "node_modules"))) {
    console.log("Installing dependencies...");
    await run("npm", ["install"]);
  }

  console.log("Starting Postgres (Docker)...");
  try {
    await run("docker", ["compose", "up", "-d"]);
  } catch {
    throw new Error(
      "Could not start Docker Compose. Open Docker Desktop and wait until it is running.",
    );
  }

  await waitForPostgres();

  console.log("Applying database schema...");
  await run("npx", ["prisma", "generate"], apiDir);
  await run("npx", ["prisma", "migrate", "deploy"], apiDir);

  console.log("");
  console.log("FINPILOT is starting:");
  console.log("  App  http://localhost:3000");
  console.log("  API  http://localhost:4000/health");
  console.log("Stop with Ctrl+C.");
  console.log("");

  await run("npm", ["run", "dev:apps"]);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
