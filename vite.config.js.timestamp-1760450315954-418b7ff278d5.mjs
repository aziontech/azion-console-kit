// vite.config.js
import { fileURLToPath, URL } from "node:url";
import process from "process";
import vue from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { defineConfig, loadEnv } from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/vite/dist/node/index.js";
import istanbul from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/vite-plugin-istanbul/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/vite.config.js";
var getConfig = () => {
  const env = loadEnv("development", process.cwd());
  const URLStartPrefix = env.VITE_ENVIRONMENT === "production" ? "https://" : "https://stage-";
  const DomainSuffix = env.VITE_ENVIRONMENT === "production" ? "com" : "net";
  const DEBUG_PROXY = env.VITE_DEBUG_PROXY === "true" && env.VITE_ENVIRONMENT !== "production";
  const createProxyConfig = ({ target, rewrite, changeOrigin = true, cookieDomainRewrite }) => ({
    target,
    changeOrigin,
    ...rewrite && { rewrite },
    ...cookieDomainRewrite && { cookieDomainRewrite },
    ...DEBUG_PROXY && {
      configure: (proxy, options) => {
        proxy.on("proxyReq", (proxyReq, req) => {
          const originalUrl = `https://${req.headers.host}${req.url}`;
          const targetUrl = options.target;
          const proxiedUrl = `${targetUrl}${req.url}`;
          console.log(`[Vite Proxy] ${req.method} ${originalUrl} => ${proxiedUrl}`);
        });
      }
    }
  });
  return {
    plugins: [
      vue(),
      vueJsx(),
      istanbul({
        nycrcPath: ".nycrc"
      })
    ],
    resolve: {
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".vue"],
      alias: {
        "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
        "@templates": fileURLToPath(new URL("./src/templates", __vite_injected_original_import_meta_url)),
        "@views": fileURLToPath(new URL("./src/views", __vite_injected_original_import_meta_url)),
        "@services": fileURLToPath(new URL("./src/services", __vite_injected_original_import_meta_url)),
        "@stores": fileURLToPath(new URL("./src/stores", __vite_injected_original_import_meta_url)),
        "@assets": fileURLToPath(new URL("./src/assets", __vite_injected_original_import_meta_url)),
        "@routes": fileURLToPath(new URL("./src/router/routes", __vite_injected_original_import_meta_url)),
        "@modules": fileURLToPath(new URL("./src/modules", __vite_injected_original_import_meta_url)),
        "@utils": fileURLToPath(new URL("./src/utils", __vite_injected_original_import_meta_url))
      }
    },
    server: {
      host: true,
      historyApiFallback: true,
      proxy: {
        // AI Studio API - MUST be first to avoid conflicts with generic /api rule
        "^/api/v4/workspace/ai": createProxyConfig({
          target: `${URLStartPrefix}ai-studio-api.azion.net/`,
          rewrite: (path) => {
            console.log(`\u{1F680} AI Studio API Proxy (with /api prefix) MATCHED!`);
            console.log(`   Original path: ${path}`);
            const cleanPath = path.replace(/^\/api/, "");
            console.log(`   Clean path (removed /api): ${cleanPath}`);
            console.log(`   Target: ${URLStartPrefix}ai-studio-api.azion.net${cleanPath}`);
            console.log(`   Full target URL: ${URLStartPrefix}ai-studio-api.azion.net${cleanPath}`);
            return cleanPath;
          },
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              console.log(`\u{1F310} AI API PROXY REQUEST INTERCEPTED:`);
              console.log(`   Method: ${proxyReq.method}`);
              console.log(`   Original URL: ${req.url}`);
              console.log(`   Proxy Path: ${proxyReq.path}`);
              console.log(`   Host: ${proxyReq.getHeader("host")}`);
              console.log(`   Target URL: ${options.target}${proxyReq.path}`);
              console.log(`   Headers:`, proxyReq.getHeaders());
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              console.log(`\u{1F4E5} AI API PROXY RESPONSE:`);
              console.log(`   Status: ${proxyRes.statusCode}`);
              console.log(`   Headers:`, proxyRes.headers);
            });
            proxy.on("error", (err, req, res) => {
              console.log(`\u274C AI API PROXY ERROR:`, err.message);
            });
          }
        }),
        // AI Studio API (direct v4 paths) - Fallback for direct calls
        "^/v4/workspace/ai": createProxyConfig({
          target: `${URLStartPrefix}ai-studio-api.azion.net/`,
          rewrite: (path) => {
            console.log(`\u{1F680} AI Studio API Proxy MATCHED!`);
            console.log(`   Original path: ${path}`);
            console.log(`   Target: ${URLStartPrefix}ai-studio-api.azion.net${path}`);
            console.log(`   Full target URL: ${URLStartPrefix}ai-studio-api.azion.net${path}`);
            return path;
          },
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              console.log(`\u{1F310} PROXY REQUEST INTERCEPTED:`);
              console.log(`   Method: ${proxyReq.method}`);
              console.log(`   Path: ${proxyReq.path}`);
              console.log(`   Host: ${proxyReq.getHeader("host")}`);
              console.log(`   Full URL: ${options.target}${proxyReq.path}`);
              console.log(`   Headers:`, proxyReq.getHeaders());
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              console.log(`\u{1F4E5} PROXY RESPONSE:`);
              console.log(`   Status: ${proxyRes.statusCode}`);
              console.log(`   Headers:`, proxyRes.headers);
            });
            proxy.on("error", (err, req, res) => {
              console.log(`\u274C PROXY ERROR:`, err.message);
            });
          }
        }),
        "^/api/marketplace": createProxyConfig({
          target: `${URLStartPrefix}marketplace.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/marketplace/, "/marketplace/api")
        }),
        "^/api/script-runner": createProxyConfig({
          target: `${URLStartPrefix}script-runner.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/script-runner/, "/script-runner/api")
        }),
        "^/api/template-engine": createProxyConfig({
          target: `${URLStartPrefix}template-engine.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/template-engine/, "/template-engine/api")
        }),
        "^/api/iam": createProxyConfig({
          target: `${URLStartPrefix}iam-api.azion.net/`,
          rewrite: (path) => path.replace(/^\/api\/iam/, "/iam/api")
        }),
        "^/api/vcs": createProxyConfig({
          target: `${URLStartPrefix}vcs-api.azion.net/`,
          rewrite: (path) => path.replace(/^\/api\/vcs/, "/vcs/api")
        }),
        "/graphql/cities": createProxyConfig({
          target: `${URLStartPrefix}cities.azion.${DomainSuffix}`,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, "/graphql")
        }),
        "/api/webhook/console_feedback": createProxyConfig({
          target: "https://automate.azion.net/",
          rewrite: (path) => path.replace(/^\/api/, "")
        }),
        "^/api/(account|user|token|switch-account|auth|password|totp)|^/logout": createProxyConfig({
          target: `${URLStartPrefix}sso.azion.com`,
          cookieDomainRewrite: { "*": "" }
        }),
        "/api": createProxyConfig({
          target: `${URLStartPrefix}api.azion.com`,
          rewrite: (path) => path.replace(/^\/api/, "")
        }),
        "/v4": createProxyConfig({
          target: `${URLStartPrefix}api.azion.com`,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              console.log(`\u26A0\uFE0F GENERIC /v4 PROXY MATCHED (should not happen for AI requests):`);
              console.log(`   Method: ${proxyReq.method}`);
              console.log(`   Path: ${proxyReq.path}`);
              console.log(`   Target: ${options.target}${proxyReq.path}`);
            });
          }
        }),
        "/webpagetest": createProxyConfig({
          target: "https://www.azion.com/api/webpagetest",
          rewrite: (path) => path.replace(/^\/webpagetest/, "")
        }),
        "/webpagetest-external": createProxyConfig({
          target: "https://www.azion.com/api/webpagetest",
          rewrite: (path) => path.replace(/^\/webpagetest-external/, "")
        }),
        "^/api/ai/copilot": createProxyConfig({
          target: `${URLStartPrefix}ai.azion.com/copilot/chat/completions`,
          rewrite: (path) => path.replace(/^\/api\/ai\/copilot/, "")
        }),
        "/graphql/accounting": createProxyConfig({
          target: `${URLStartPrefix}console.azion.com`,
          rewrite: (path) => path.replace(/^\/graphql\/accounting/, "/accounting/graphql")
        })
      }
    }
  };
};
var vite_config_default = defineConfig(getConfig());
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWxlc3NhbmRyby5jYXVkdXJvL3Byb2plY3RzL2F6aW9uLWNvbnNvbGUtYWlzdHVkaW9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbGVzc2FuZHJvLmNhdWR1cm8vcHJvamVjdHMvYXppb24tY29uc29sZS1haXN0dWRpby92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWxlc3NhbmRyby5jYXVkdXJvL3Byb2plY3RzL2F6aW9uLWNvbnNvbGUtYWlzdHVkaW8vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnXG5cbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcbmltcG9ydCBpc3RhbmJ1bCBmcm9tICd2aXRlLXBsdWdpbi1pc3RhbmJ1bCdcblxuY29uc3QgZ2V0Q29uZmlnID0gKCkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KCdkZXZlbG9wbWVudCcsIHByb2Nlc3MuY3dkKCkpXG4gIGNvbnN0IFVSTFN0YXJ0UHJlZml4ID0gZW52LlZJVEVfRU5WSVJPTk1FTlQgPT09ICdwcm9kdWN0aW9uJyA/ICdodHRwczovLycgOiAnaHR0cHM6Ly9zdGFnZS0nXG4gIGNvbnN0IERvbWFpblN1ZmZpeCA9IGVudi5WSVRFX0VOVklST05NRU5UID09PSAncHJvZHVjdGlvbicgPyAnY29tJyA6ICduZXQnXG4gIGNvbnN0IERFQlVHX1BST1hZID0gZW52LlZJVEVfREVCVUdfUFJPWFkgPT09ICd0cnVlJyAmJiBlbnYuVklURV9FTlZJUk9OTUVOVCAhPT0gJ3Byb2R1Y3Rpb24nXG5cbiAgY29uc3QgY3JlYXRlUHJveHlDb25maWcgPSAoeyB0YXJnZXQsIHJld3JpdGUsIGNoYW5nZU9yaWdpbiA9IHRydWUsIGNvb2tpZURvbWFpblJld3JpdGUgfSkgPT4gKHtcbiAgICB0YXJnZXQsXG4gICAgY2hhbmdlT3JpZ2luLFxuICAgIC4uLihyZXdyaXRlICYmIHsgcmV3cml0ZSB9KSxcbiAgICAuLi4oY29va2llRG9tYWluUmV3cml0ZSAmJiB7IGNvb2tpZURvbWFpblJld3JpdGUgfSksXG4gICAgLi4uKERFQlVHX1BST1hZICYmIHtcbiAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBvcHRpb25zKSA9PiB7XG4gICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxKSA9PiB7XG4gICAgICAgICAgY29uc3Qgb3JpZ2luYWxVcmwgPSBgaHR0cHM6Ly8ke3JlcS5oZWFkZXJzLmhvc3R9JHtyZXEudXJsfWBcbiAgICAgICAgICBjb25zdCB0YXJnZXRVcmwgPSBvcHRpb25zLnRhcmdldFxuICAgICAgICAgIGNvbnN0IHByb3hpZWRVcmwgPSBgJHt0YXJnZXRVcmx9JHtyZXEudXJsfWBcblxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgY29uc29sZS5sb2coYFtWaXRlIFByb3h5XSAke3JlcS5tZXRob2R9ICR7b3JpZ2luYWxVcmx9ID0+ICR7cHJveGllZFVybH1gKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICB2dWUoKSxcbiAgICAgIHZ1ZUpzeCgpLFxuICAgICAgaXN0YW5idWwoe1xuICAgICAgICBueWNyY1BhdGg6ICcubnljcmMnXG4gICAgICB9KVxuICAgIF0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgZXh0ZW5zaW9uczogWycubWpzJywgJy5qcycsICcubXRzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nLCAnLnZ1ZSddLFxuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAdGVtcGxhdGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy90ZW1wbGF0ZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0B2aWV3cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvdmlld3MnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BzZXJ2aWNlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc2VydmljZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BzdG9yZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3N0b3JlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQGFzc2V0cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvYXNzZXRzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAcm91dGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9yb3V0ZXIvcm91dGVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAbW9kdWxlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvbW9kdWxlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHV0aWxzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy91dGlscycsIGltcG9ydC5tZXRhLnVybCkpXG4gICAgICB9XG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IHRydWUsXG4gICAgICBoaXN0b3J5QXBpRmFsbGJhY2s6IHRydWUsXG4gICAgICBwcm94eToge1xuICAgICAgICAvLyBBSSBTdHVkaW8gQVBJIC0gTVVTVCBiZSBmaXJzdCB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBnZW5lcmljIC9hcGkgcnVsZVxuICAgICAgICAnXi9hcGkvdjQvd29ya3NwYWNlL2FpJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YWktc3R1ZGlvLWFwaS5hemlvbi5uZXQvYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1REU4MCBBSSBTdHVkaW8gQVBJIFByb3h5ICh3aXRoIC9hcGkgcHJlZml4KSBNQVRDSEVEIWApXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgT3JpZ2luYWwgcGF0aDogJHtwYXRofWApXG4gICAgICAgICAgICBjb25zdCBjbGVhblBhdGggPSBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBDbGVhbiBwYXRoIChyZW1vdmVkIC9hcGkpOiAke2NsZWFuUGF0aH1gKVxuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIFRhcmdldDogJHtVUkxTdGFydFByZWZpeH1haS1zdHVkaW8tYXBpLmF6aW9uLm5ldCR7Y2xlYW5QYXRofWApXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgRnVsbCB0YXJnZXQgVVJMOiAke1VSTFN0YXJ0UHJlZml4fWFpLXN0dWRpby1hcGkuYXppb24ubmV0JHtjbGVhblBhdGh9YClcbiAgICAgICAgICAgIHJldHVybiBjbGVhblBhdGhcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0NcdURGMTAgQUkgQVBJIFBST1hZIFJFUVVFU1QgSU5URVJDRVBURUQ6YClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIE1ldGhvZDogJHtwcm94eVJlcS5tZXRob2R9YClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIE9yaWdpbmFsIFVSTDogJHtyZXEudXJsfWApXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBQcm94eSBQYXRoOiAke3Byb3h5UmVxLnBhdGh9YClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIEhvc3Q6ICR7cHJveHlSZXEuZ2V0SGVhZGVyKCdob3N0Jyl9YClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIFRhcmdldCBVUkw6ICR7b3B0aW9ucy50YXJnZXR9JHtwcm94eVJlcS5wYXRofWApXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBIZWFkZXJzOmAsIHByb3h5UmVxLmdldEhlYWRlcnMoKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTUgQUkgQVBJIFBST1hZIFJFU1BPTlNFOmApXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBTdGF0dXM6ICR7cHJveHlSZXMuc3RhdHVzQ29kZX1gKVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgSGVhZGVyczpgLCBwcm94eVJlcy5oZWFkZXJzKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcdTI3NEMgQUkgQVBJIFBST1hZIEVSUk9SOmAsIGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICAvLyBBSSBTdHVkaW8gQVBJIChkaXJlY3QgdjQgcGF0aHMpIC0gRmFsbGJhY2sgZm9yIGRpcmVjdCBjYWxsc1xuICAgICAgICAnXi92NC93b3Jrc3BhY2UvYWknOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1haS1zdHVkaW8tYXBpLmF6aW9uLm5ldC9gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERTgwIEFJIFN0dWRpbyBBUEkgUHJveHkgTUFUQ0hFRCFgKVxuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIE9yaWdpbmFsIHBhdGg6ICR7cGF0aH1gKVxuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIFRhcmdldDogJHtVUkxTdGFydFByZWZpeH1haS1zdHVkaW8tYXBpLmF6aW9uLm5ldCR7cGF0aH1gKVxuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIEZ1bGwgdGFyZ2V0IFVSTDogJHtVUkxTdGFydFByZWZpeH1haS1zdHVkaW8tYXBpLmF6aW9uLm5ldCR7cGF0aH1gKVxuICAgICAgICAgICAgcmV0dXJuIHBhdGhcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0NcdURGMTAgUFJPWFkgUkVRVUVTVCBJTlRFUkNFUFRFRDpgKVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgTWV0aG9kOiAke3Byb3h5UmVxLm1ldGhvZH1gKVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgUGF0aDogJHtwcm94eVJlcS5wYXRofWApXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBIb3N0OiAke3Byb3h5UmVxLmdldEhlYWRlcignaG9zdCcpfWApXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBGdWxsIFVSTDogJHtvcHRpb25zLnRhcmdldH0ke3Byb3h5UmVxLnBhdGh9YClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIEhlYWRlcnM6YCwgcHJveHlSZXEuZ2V0SGVhZGVycygpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcycsIChwcm94eVJlcywgcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENFNSBQUk9YWSBSRVNQT05TRTpgKVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgU3RhdHVzOiAke3Byb3h5UmVzLnN0YXR1c0NvZGV9YClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIEhlYWRlcnM6YCwgcHJveHlSZXMuaGVhZGVycylcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCByZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgXHUyNzRDIFBST1hZIEVSUk9SOmAsIGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvbWFya2V0cGxhY2UnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYXJrZXRwbGFjZS5hemlvbi5jb20vYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvbWFya2V0cGxhY2UvLCAnL21hcmtldHBsYWNlL2FwaScpXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvc2NyaXB0LXJ1bm5lcic6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXNjcmlwdC1ydW5uZXIuYXppb24uY29tL2AsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3NjcmlwdC1ydW5uZXIvLCAnL3NjcmlwdC1ydW5uZXIvYXBpJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS90ZW1wbGF0ZS1lbmdpbmUnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH10ZW1wbGF0ZS1lbmdpbmUuYXppb24uY29tL2AsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3RlbXBsYXRlLWVuZ2luZS8sICcvdGVtcGxhdGUtZW5naW5lL2FwaScpXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvaWFtJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9aWFtLWFwaS5hemlvbi5uZXQvYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvaWFtLywgJy9pYW0vYXBpJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS92Y3MnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH12Y3MtYXBpLmF6aW9uLm5ldC9gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC92Y3MvLCAnL3Zjcy9hcGknKVxuICAgICAgICB9KSxcbiAgICAgICAgJy9ncmFwaHFsL2NpdGllcyc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWNpdGllcy5hemlvbi4ke0RvbWFpblN1ZmZpeH1gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvY2l0aWVzLywgJy9ncmFwaHFsJylcbiAgICAgICAgfSksXG4gICAgICAgICcvYXBpL3dlYmhvb2svY29uc29sZV9mZWVkYmFjayc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwczovL2F1dG9tYXRlLmF6aW9uLm5ldC8nLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS8oYWNjb3VudHx1c2VyfHRva2VufHN3aXRjaC1hY2NvdW50fGF1dGh8cGFzc3dvcmR8dG90cCl8Xi9sb2dvdXQnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1zc28uYXppb24uY29tYCxcbiAgICAgICAgICBjb29raWVEb21haW5SZXdyaXRlOiB7ICcqJzogJycgfVxuICAgICAgICB9KSxcbiAgICAgICAgJy9hcGknOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1hcGkuYXppb24uY29tYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAnL3Y0JzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YXBpLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY29uZmlndXJlOiAocHJveHksIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFx1MjZBMFx1RkUwRiBHRU5FUklDIC92NCBQUk9YWSBNQVRDSEVEIChzaG91bGQgbm90IGhhcHBlbiBmb3IgQUkgcmVxdWVzdHMpOmApXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBNZXRob2Q6ICR7cHJveHlSZXEubWV0aG9kfWApXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICBQYXRoOiAke3Byb3h5UmVxLnBhdGh9YClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIFRhcmdldDogJHtvcHRpb25zLnRhcmdldH0ke3Byb3h5UmVxLnBhdGh9YClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgJy93ZWJwYWdldGVzdCc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwczovL3d3dy5hemlvbi5jb20vYXBpL3dlYnBhZ2V0ZXN0JyxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvd2VicGFnZXRlc3QvLCAnJylcbiAgICAgICAgfSksXG4gICAgICAgICcvd2VicGFnZXRlc3QtZXh0ZXJuYWwnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly93d3cuYXppb24uY29tL2FwaS93ZWJwYWdldGVzdCcsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3dlYnBhZ2V0ZXN0LWV4dGVybmFsLywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvYWkvY29waWxvdCc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWFpLmF6aW9uLmNvbS9jb3BpbG90L2NoYXQvY29tcGxldGlvbnNgLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC9haVxcL2NvcGlsb3QvLCAnJylcbiAgICAgICAgfSksXG4gICAgICAgICcvZ3JhcGhxbC9hY2NvdW50aW5nJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9Y29uc29sZS5hemlvbi5jb21gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvYWNjb3VudGluZy8sICcvYWNjb3VudGluZy9ncmFwaHFsJylcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGdldENvbmZpZygpKVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2VixTQUFTLGVBQWUsV0FBVztBQUNoWSxPQUFPLGFBQWE7QUFFcEIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUNuQixTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLGNBQWM7QUFOcU0sSUFBTSwyQ0FBMkM7QUFRM1EsSUFBTSxZQUFZLE1BQU07QUFDdEIsUUFBTSxNQUFNLFFBQVEsZUFBZSxRQUFRLElBQUksQ0FBQztBQUNoRCxRQUFNLGlCQUFpQixJQUFJLHFCQUFxQixlQUFlLGFBQWE7QUFDNUUsUUFBTSxlQUFlLElBQUkscUJBQXFCLGVBQWUsUUFBUTtBQUNyRSxRQUFNLGNBQWMsSUFBSSxxQkFBcUIsVUFBVSxJQUFJLHFCQUFxQjtBQUVoRixRQUFNLG9CQUFvQixDQUFDLEVBQUUsUUFBUSxTQUFTLGVBQWUsTUFBTSxvQkFBb0IsT0FBTztBQUFBLElBQzVGO0FBQUEsSUFDQTtBQUFBLElBQ0EsR0FBSSxXQUFXLEVBQUUsUUFBUTtBQUFBLElBQ3pCLEdBQUksdUJBQXVCLEVBQUUsb0JBQW9CO0FBQUEsSUFDakQsR0FBSSxlQUFlO0FBQUEsTUFDakIsV0FBVyxDQUFDLE9BQU8sWUFBWTtBQUM3QixjQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsUUFBUTtBQUN0QyxnQkFBTSxjQUFjLFdBQVcsSUFBSSxRQUFRLElBQUksR0FBRyxJQUFJLEdBQUc7QUFDekQsZ0JBQU0sWUFBWSxRQUFRO0FBQzFCLGdCQUFNLGFBQWEsR0FBRyxTQUFTLEdBQUcsSUFBSSxH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
