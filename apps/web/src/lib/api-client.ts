import type {
  AnalyticsSummary,
  AuthResponse,
  Expense,
  ExpenseInput,
  FinancialHealth,
  Income,
  IncomeInput,
  Loan,
  LoanInput,
  UserPublic,
} from "@finpilot/shared";

const ACCESS_KEY = "finpilot:accessToken";
const USER_KEY = "finpilot:user";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeAuth(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getStoredUser(): UserPublic | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserPublic;
  } catch {
    return null;
  }
}

function setSession(accessToken: string, user: UserPublic) {
  sessionStorage.setItem(ACCESS_KEY, accessToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  notify();
}

function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(USER_KEY);
  notify();
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function refreshAccess(): Promise<string | null> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = (await res.json()) as AuthResponse;
  setSession(data.accessToken, data.user);
  return data.accessToken;
}

export async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry && !path.includes("/api/auth/login")) {
    const next = await refreshAccess();
    if (next) return apiFetch(path, init, false);
  }
  return res;
}

async function json<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}

export const api = {
  async register(input: { name: string; email: string; password: string }) {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }, false);
    const data = await json<AuthResponse>(res);
    setSession(data.accessToken, data.user);
    return data;
  },
  async login(input: { email: string; password: string }) {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }, false);
    const data = await json<AuthResponse>(res);
    setSession(data.accessToken, data.user);
    return data;
  },
  async logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }, false);
    clearSession();
  },
  async restoreSession() {
    if (getAccessToken()) return getStoredUser();
    return (await refreshAccess()) ? getStoredUser() : null;
  },
  income: {
    list: () => apiFetch("/api/income").then((r) => json<Income[]>(r)),
    create: (input: IncomeInput) =>
      apiFetch("/api/income", { method: "POST", body: JSON.stringify(input) }).then((r) =>
        json<Income>(r),
      ),
    update: (id: string, input: IncomeInput) =>
      apiFetch(`/api/income/${id}`, { method: "PUT", body: JSON.stringify(input) }).then((r) =>
        json<Income>(r),
      ),
    remove: (id: string) => apiFetch(`/api/income/${id}`, { method: "DELETE" }).then((r) => json(r)),
  },
  expenses: {
    list: () => apiFetch("/api/expenses").then((r) => json<Expense[]>(r)),
    create: (input: ExpenseInput) =>
      apiFetch("/api/expenses", { method: "POST", body: JSON.stringify(input) }).then((r) =>
        json<Expense>(r),
      ),
    update: (id: string, input: ExpenseInput) =>
      apiFetch(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(input) }).then((r) =>
        json<Expense>(r),
      ),
    remove: (id: string) =>
      apiFetch(`/api/expenses/${id}`, { method: "DELETE" }).then((r) => json(r)),
  },
  loans: {
    list: () => apiFetch("/api/loans").then((r) => json<Loan[]>(r)),
    create: (input: LoanInput) =>
      apiFetch("/api/loans", { method: "POST", body: JSON.stringify(input) }).then((r) =>
        json<Loan>(r),
      ),
    update: (id: string, input: LoanInput) =>
      apiFetch(`/api/loans/${id}`, { method: "PUT", body: JSON.stringify(input) }).then((r) =>
        json<Loan>(r),
      ),
    remove: (id: string) => apiFetch(`/api/loans/${id}`, { method: "DELETE" }).then((r) => json(r)),
  },
  analytics: {
    summary: () => apiFetch("/api/analytics/summary").then((r) => json<AnalyticsSummary>(r)),
    health: () =>
      apiFetch("/api/analytics/financial-health").then((r) => json<FinancialHealth>(r)),
  },
};
