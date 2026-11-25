import { environmentValidation } from "@/lib/env";
import { clearSession, loadSession } from "@/features/auth/session";

const rawBase = environmentValidation.ok
  ? environmentValidation.values.VITE_API_BASE_URL
  : ((import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL ?? "");

const API_BASE_URL = rawBase.replace(/\/+$/, "");

export const SESSION_EXPIRED_FLAG = "rydee.expired";

export function joinUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function isLoginUrl(url: string): boolean {
  return url.endsWith("/user-login") || url.includes("/user-login?");
}

function handleGlobal401(url: string): void {
  if (isLoginUrl(url)) return;
  if (typeof window === "undefined") return;
  clearSession();
  try {
    window.sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");
  } catch {
    /* storage unavailable */
  }
  const onLogin = window.location.pathname === "/login";
  if (!onLogin) {
    window.location.href = "/login?reason=expired";
  }
}

class ApiError extends Error {
  readonly status: number;
  readonly responseText: string;

  constructor(status: number, responseText: string, statusText: string) {
    super(responseText || statusText || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.responseText = responseText;
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  body?: unknown;
}

const API_REQUEST_TIMEOUT_MS = 45_000;

async function request<T>(method: Method, url: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!isLoginUrl(url)) {
    const accessToken = loadSession()?.accessToken;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const init: RequestInit = {
    method,
    credentials: "include",
  };

  if (Object.keys(headers).length > 0) init.headers = headers;
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  const controller = new AbortController();
  init.signal = controller.signal;
  const startedAt = Date.now();
  console.info(`[api] ${method} ${url}`, { timeoutMs: API_REQUEST_TIMEOUT_MS });
  const timeoutId = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, init);
    const elapsedMs = Date.now() - startedAt;

    if (!response.ok) {
      console.warn(`[api] ${method} ${url} failed`, { status: response.status, elapsedMs });
      const text = await response.text();
      if (response.status === 401) handleGlobal401(url);
      throw new ApiError(response.status, text, response.statusText);
    }

    const data = (await response.json()) as T;
    console.info(`[api] ${method} ${url} completed`, { elapsedMs, status: response.status });
    return data;
  } catch (error) {
    if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") {
      console.warn(`[api] ${method} ${url} timed out`, { elapsedMs: Date.now() - startedAt });
      throw new ApiError(0, "Request timed out", "Request timed out");
    }
    console.warn(`[api] ${method} ${url} error`, { elapsedMs: Date.now() - startedAt, error });
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function get<T>(url: string): Promise<T> {
  return request<T>("GET", url);
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return request<T>("POST", url, { body });
}

export function put<T>(url: string, body?: unknown): Promise<T> {
  return request<T>("PUT", url, { body });
}

export function del<T>(url: string): Promise<T> {
  return request<T>("DELETE", url);
}

export interface UploadHandle<T> {
  promise: Promise<T>;
  abort: () => void;
}

export function postMultipartWithProgress<T>(
  url: string,
  form: FormData,
  onProgress: (percent: number) => void,
): UploadHandle<T> {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<T>((resolve, reject) => {
    xhr.open("POST", url, true);
    xhr.withCredentials = true;
    if (!isLoginUrl(url)) {
      const accessToken = loadSession()?.accessToken;
      if (accessToken) xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new ApiError(xhr.status, xhr.responseText, "Invalid JSON"));
        }
      } else {
        if (xhr.status === 401) handleGlobal401(url);
        reject(new ApiError(xhr.status, xhr.responseText, xhr.statusText));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "", "Network error"));
    xhr.onabort = () => reject(new ApiError(0, "", "Aborted"));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

export class EndpointNotAvailableError extends Error {
  readonly endpoint: string;
  constructor(endpoint: string) {
    super(`The backend does not provide the "${endpoint}" endpoint yet.`);
    this.name = "EndpointNotAvailableError";
    this.endpoint = endpoint;
  }
}
