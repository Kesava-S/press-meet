// cors.config.js
// ─────────────────────────────────────────────────────────────────
// Vite CORS Proxy Config — n8n Webhook
// Usage: import and spread into your vite.config.js server.proxy
// ─────────────────────────────────────────────────────────────────
//
//  In vite.config.js:
//
//    import { n8nProxy } from './cors.config.js'
//
//    export default defineConfig({
//      server: {
//        proxy: {
//          ...n8nProxy
//        }
//      }
//    })
//
// ─────────────────────────────────────────────────────────────────
//  In your .env file:
//
//    VITE_N8N_WEBHOOK_URL=http://localhost:5173/n8n
//
//  This makes all fetch('/n8n/...') calls proxy to your live n8n.
// ─────────────────────────────────────────────────────────────────

const VITE_N8N_WEBHOOK_URL = process.env.VITE_N8N_WEBHOOK_URL || "https://n8n.srv1198607.hstgr.cloud/webhook";

export const n8nProxy = {
  "/n8n": {
    target: VITE_N8N_WEBHOOK_URL,
    changeOrigin: true,         // spoofs the Host header — required for CORS
    secure: true,               // set false if n8n uses a self-signed cert
    rewrite: (path) => path.replace(/^\/n8n/, ""),
    configure: (proxy) => {
      proxy.on("error", (err) => {
        console.error("[n8n proxy] error:", err.message);
      });
      proxy.on("proxyReq", (proxyReq, req) => {
        console.log(`[n8n proxy] → ${req.method} ${N8N_TARGET}${proxyReq.path}`);
      });
      proxy.on("proxyRes", (proxyRes, req) => {
        console.log(`[n8n proxy] ← ${proxyRes.statusCode} ${req.url}`);
      });
    },
  },
};