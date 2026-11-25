import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const PROXY_PREFIXES = [
  "/user-login",
  "/register-user",
  "/update-user",
  "/get-all-riders",
  "/activate-rider",
  "/change-password",
  "/get-all-trips",
  "/get-driver-trips",
  "/get-rides",
  "/get-ride",
  "/get-rides-summary",
  "/get-all-users",
  "/delete-user",
] as const;

export default defineConfig(({ command, mode }) => {
  const proxyTarget =
    command === "serve"
      ? loadEnv("development", process.cwd(), "").VITE_DEV_PROXY_TARGET
      : undefined;

  // QA/demo builds (`vite build --mode qa`) bundle and boot MSW without any
  // committed env file: statically define the flag so Vite tree-shakes the
  // mocks in. A real env var (CI/local) still wins over this default.
  const define =
    mode === "qa" && process.env.VITE_ENABLE_MSW === undefined
      ? { "import.meta.env.VITE_ENABLE_MSW": JSON.stringify("true") }
      : undefined;

  const proxy = proxyTarget
    ? Object.fromEntries(
        PROXY_PREFIXES.map((prefix) => [
          prefix,
          {
            target: proxyTarget,
            changeOrigin: true,
            cookieDomainRewrite: "localhost",
            secure: true,
            timeout: 45_000,
            proxyTimeout: 45_000,
          },
        ]),
      )
    : undefined;

  return {
    define,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    assetsInclude: ["**/*.svg", "**/*.csv"],
    server: {
      proxy,
    },
    test: {
      environment: "jsdom",
      globals: true,
      testTimeout: 10000,
      setupFiles: ["./tests/setup.ts"],
      include: ["tests/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["tests/e2e/**", "node_modules/**"],
      css: false,
      clearMocks: true,
      restoreMocks: true,
      env: {
        VITE_API_BASE_URL: "http://localhost:3000",
        VITE_ENABLE_MSW: "true",
      },
    },
  };
});
