"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getAccessToken } from "@/lib/api-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (getAccessToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      const user = await api.restoreSession();
      if (cancelled) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-muted">
        Loading your workspace…
      </div>
    );
  }

  return <>{children}</>;
}
