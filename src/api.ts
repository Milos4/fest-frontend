import axios from "axios";

export const API_URL = "http://localhost:8080/api";

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Salje serverski session cookie i CSRF header samo nasem backendu. */
export function configureApi() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!new URL(url, window.location.origin).href.startsWith(API_URL + "/")) return originalFetch(input, init);
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    headers.set("X-Requested-With", "FestApplication");
    return originalFetch(input, { ...init, headers, credentials: "include" }).then(response => {
      handleExpiredSession(url, response.status);
      return response;
    });
  };
  axios.interceptors.request.use(config => {
    if (config.url?.startsWith(API_URL + "/")) {
      config.withCredentials = true;
      config.headers.set("X-Requested-With", "FestApplication");
    }
    return config;
  });
  axios.interceptors.response.use(response => response, error => {
    if (error.config?.url?.startsWith(API_URL + "/")) handleExpiredSession(error.config.url, error.response?.status);
    return Promise.reject(error);
  });
}

/** Istek sesije vraca korisnika na login umjesto prikazivanja zastarjelog naloga. */
function handleExpiredSession(url: string, status: number) {
  if (status === 401 && !url.endsWith("/login") && window.location.pathname !== "/" && window.location.pathname !== "/login") {
    localStorage.removeItem("userData");
    window.location.replace("/");
  }
}

/** Zajednicki JSON poziv koji ne tretira HTTP gresku kao uspjeh. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(API_URL + path, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options.headers, "X-Requested-With": "FestApplication" },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status);
  }
  return response.status === 204 ? undefined as T : response.json();
}

/** Odjavljuje i serversku sesiju prije uklanjanja lokalnog prikaza naloga. */
export async function logout() {
  await api<void>("/logout", { method: "POST" });
  localStorage.removeItem("userData");
  sessionStorage.clear();
  window.location.replace("/");
}

/** Mapira razloge iz postojeceg modala na enum backend modela i cuva report. */
export async function reportPost(postId: number, reason: string) {
  const types: Record<string, string> = {
    "Spam or misleading": "SPAM", "Hate or harassment": "ABUSE",
    "Violence or dangerous content": "VIOLENCE", "Nudity or sexual content": "NUDITY", "Other": "OTHER",
  };
  return api("/reports", { method: "POST", body: JSON.stringify({ postId, type: types[reason] || "OTHER", message: reason }) });
}
