import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The browser talks to the backend directly (default http://localhost:8000,
// override with VITE_API_BASE); the backend allows this origin via CORS.
// A dev proxy was tried first but Vite's proxy stalls SSE streams.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
