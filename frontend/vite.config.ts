import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file from the current working directory
  const env = loadEnv(mode, process.cwd(), "");

  // Fallback chain: Check file env, then system env, then the internal Docker container name
  const backendUrl = env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || "http://backend:8000";

  // Safeguard: Ensure the proxy target is never empty or malformed
  const targetUrl = backendUrl.trim() ? backendUrl : "http://backend:8000";

  console.log(`[Vite Proxy] Target backend set to: ${targetUrl}`);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      allowedHosts: [
        "uncomplaining-irritative-ranee.ngrok-free.dev",
        "frontend-nine-zeta-40.vercel.app",
      ],
      port: 5173,
      proxy: {
        "/api": {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          // This rewrites /api/login-auth to /api/login-auth when sending to Symfony,
          // ensuring your backend receives the correct /api prefix.
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
          },
        },
      },
    },
  };
});