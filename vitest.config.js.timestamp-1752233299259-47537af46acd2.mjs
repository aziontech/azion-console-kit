// vitest.config.js
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { mergeConfig, defineConfig as defineConfig2 } from "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/node_modules/vite/dist/node/index.js";
import { configDefaults } from "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/node_modules/vitest/dist/config.js";

// vite.config.js
import { fileURLToPath, URL as URL2 } from "node:url";
import process from "process";
import vue from "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { defineConfig, loadEnv } from "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/node_modules/vite/dist/node/index.js";
import istanbul from "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/node_modules/vite-plugin-istanbul/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/vite.config.js";
var getConfig = () => {
  const env = loadEnv("development", process.cwd());
  const URLStartPrefix = env.VITE_ENVIRONMENT === "production" ? "https://" : "https://stage-";
  const DomainSuffix = env.VITE_ENVIRONMENT === "production" ? "com" : "net";
  const DEBUG_PROXY = env.VITE_DEBUG_PROXY;
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
        "@": fileURLToPath(new URL2("./src", __vite_injected_original_import_meta_url)),
        "@templates": fileURLToPath(new URL2("./src/templates", __vite_injected_original_import_meta_url)),
        "@views": fileURLToPath(new URL2("./src/views", __vite_injected_original_import_meta_url)),
        "@services": fileURLToPath(new URL2("./src/services", __vite_injected_original_import_meta_url)),
        "@stores": fileURLToPath(new URL2("./src/stores", __vite_injected_original_import_meta_url)),
        "@assets": fileURLToPath(new URL2("./src/assets", __vite_injected_original_import_meta_url)),
        "@routes": fileURLToPath(new URL2("./src/router/routes", __vite_injected_original_import_meta_url)),
        "@modules": fileURLToPath(new URL2("./src/modules", __vite_injected_original_import_meta_url))
      }
    },
    server: {
      proxy: {
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
          target: `${URLStartPrefix}api.azion.com`
        }),
        "/webpagetest": createProxyConfig({
          target: "https://www.azion.com/api/webpagetest",
          rewrite: (path) => path.replace(/^\/webpagetest/, "")
        }),
        "/webpagetest-external": createProxyConfig({
          target: "https://www.azion.com/api/webpagetest",
          rewrite: (path) => path.replace(/^\/webpagetest-external/, "")
        }),
        "/ai": createProxyConfig({
          target: `${URLStartPrefix}ai.azion.com/copilot/chat/completions`,
          rewrite: (path) => path.replace(/^\/ai/, "")
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

// vitest.config.js
var __vite_injected_original_import_meta_url2 = "file:///Users/peterson.silva/Desktop/Repos/azion-console-kit/vitest.config.js";
var vitest_config_default = mergeConfig(
  vite_config_default,
  defineConfig2({
    test: {
      setupFiles: ["src/tests/setup-tests.js"],
      environment: "jsdom",
      passWithNoTests: true,
      exclude: [
        ...configDefaults.exclude,
        "e2e/*",
        "cypress",
        "azion",
        ".vscode",
        ".husky",
        ".vite",
        ".github",
        "docs",
        "public"
      ],
      root: fileURLToPath2(new URL("./", __vite_injected_original_import_meta_url2)),
      transformMode: {
        web: [/\.[jt]sx$/]
      },
      coverage: {
        enabled: true,
        include: [
          "src/services/**",
          "src/views/**",
          "src/helpers/**",
          "src/plugins/**",
          "src/modules/**"
        ],
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
        reporter: ["text", "lcov", "html"],
        reportsDirectory: "./coverage/unit"
      },
      reporters: ["default", "vitest-sonar-reporter"],
      outputFile: {
        "vitest-sonar-reporter": "./coverage/unit/sonar-report.xml"
      },
      testTimeout: 3e4
    }
  })
);
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyIsICJ2aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wZXRlcnNvbi5zaWx2YS9EZXNrdG9wL1JlcG9zL2F6aW9uLWNvbnNvbGUta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGV0ZXJzb24uc2lsdmEvRGVza3RvcC9SZXBvcy9hemlvbi1jb25zb2xlLWtpdC92aXRlc3QuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9wZXRlcnNvbi5zaWx2YS9EZXNrdG9wL1JlcG9zL2F6aW9uLWNvbnNvbGUta2l0L3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBtZXJnZUNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGNvbmZpZ0RlZmF1bHRzIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gJy4vdml0ZS5jb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIHNldHVwRmlsZXM6IFsnc3JjL3Rlc3RzL3NldHVwLXRlc3RzLmpzJ10sXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICAgIHBhc3NXaXRoTm9UZXN0czogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgLi4uY29uZmlnRGVmYXVsdHMuZXhjbHVkZSxcbiAgICAgICAgJ2UyZS8qJyxcbiAgICAgICAgJ2N5cHJlc3MnLFxuICAgICAgICAnYXppb24nLFxuICAgICAgICAnLnZzY29kZScsXG4gICAgICAgICcuaHVza3knLFxuICAgICAgICAnLnZpdGUnLFxuICAgICAgICAnLmdpdGh1YicsXG4gICAgICAgICdkb2NzJyxcbiAgICAgICAgJ3B1YmxpYydcbiAgICAgIF0sXG4gICAgICByb290OiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICB0cmFuc2Zvcm1Nb2RlOiB7XG4gICAgICAgIHdlYjogWy9cXC5banRdc3gkL11cbiAgICAgIH0sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBpbmNsdWRlOiBbXG4gICAgICAgICAgJ3NyYy9zZXJ2aWNlcy8qKicsXG4gICAgICAgICAgJ3NyYy92aWV3cy8qKicsXG4gICAgICAgICAgJ3NyYy9oZWxwZXJzLyoqJyxcbiAgICAgICAgICAnc3JjL3BsdWdpbnMvKionLFxuICAgICAgICAgICdzcmMvbW9kdWxlcy8qKidcbiAgICAgICAgXSxcbiAgICAgICAgc3RhdGVtZW50czogNTAsXG4gICAgICAgIGJyYW5jaGVzOiA1MCxcbiAgICAgICAgZnVuY3Rpb25zOiA1MCxcbiAgICAgICAgbGluZXM6IDUwLFxuICAgICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2xjb3YnLCAnaHRtbCddLFxuICAgICAgICByZXBvcnRzRGlyZWN0b3J5OiAnLi9jb3ZlcmFnZS91bml0JyxcbiAgICAgIH0sXG4gICAgICByZXBvcnRlcnM6IFsnZGVmYXVsdCcsICd2aXRlc3Qtc29uYXItcmVwb3J0ZXInXSxcbiAgICAgIG91dHB1dEZpbGU6IHtcbiAgICAgICAgJ3ZpdGVzdC1zb25hci1yZXBvcnRlcic6ICcuL2NvdmVyYWdlL3VuaXQvc29uYXItcmVwb3J0LnhtbCdcbiAgICAgIH0sXG4gICAgICB0ZXN0VGltZW91dDogMzAwMDBcbiAgICB9XG4gIH0pXG4pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wZXRlcnNvbi5zaWx2YS9EZXNrdG9wL1JlcG9zL2F6aW9uLWNvbnNvbGUta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGV0ZXJzb24uc2lsdmEvRGVza3RvcC9SZXBvcy9hemlvbi1jb25zb2xlLWtpdC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGV0ZXJzb24uc2lsdmEvRGVza3RvcC9SZXBvcy9hemlvbi1jb25zb2xlLWtpdC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAncHJvY2VzcydcblxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IGlzdGFuYnVsIGZyb20gJ3ZpdGUtcGx1Z2luLWlzdGFuYnVsJ1xuXG5jb25zdCBnZXRDb25maWcgPSAoKSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYoJ2RldmVsb3BtZW50JywgcHJvY2Vzcy5jd2QoKSlcbiAgY29uc3QgVVJMU3RhcnRQcmVmaXggPSBlbnYuVklURV9FTlZJUk9OTUVOVCA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2h0dHBzOi8vJyA6ICdodHRwczovL3N0YWdlLSdcbiAgY29uc3QgRG9tYWluU3VmZml4ID0gZW52LlZJVEVfRU5WSVJPTk1FTlQgPT09ICdwcm9kdWN0aW9uJyA/ICdjb20nIDogJ25ldCdcbiAgY29uc3QgREVCVUdfUFJPWFkgPSBlbnYuVklURV9ERUJVR19QUk9YWVxuXG4gIGNvbnN0IGNyZWF0ZVByb3h5Q29uZmlnID0gKHsgdGFyZ2V0LCByZXdyaXRlLCBjaGFuZ2VPcmlnaW4gPSB0cnVlLCBjb29raWVEb21haW5SZXdyaXRlIH0pID0+ICh7XG4gICAgdGFyZ2V0LFxuICAgIGNoYW5nZU9yaWdpbixcbiAgICAuLi4ocmV3cml0ZSAmJiB7IHJld3JpdGUgfSksXG4gICAgLi4uKGNvb2tpZURvbWFpblJld3JpdGUgJiYgeyBjb29raWVEb21haW5SZXdyaXRlIH0pLFxuICAgIC4uLihERUJVR19QUk9YWSAmJiB7XG4gICAgICBjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xuICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSkgPT4ge1xuICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVXJsID0gYGh0dHBzOi8vJHtyZXEuaGVhZGVycy5ob3N0fSR7cmVxLnVybH1gXG4gICAgICAgICAgY29uc3QgdGFyZ2V0VXJsID0gb3B0aW9ucy50YXJnZXRcbiAgICAgICAgICBjb25zdCBwcm94aWVkVXJsID0gYCR7dGFyZ2V0VXJsfSR7cmVxLnVybH1gXG5cbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbVml0ZSBQcm94eV0gJHtyZXEubWV0aG9kfSAke29yaWdpbmFsVXJsfSA9PiAke3Byb3hpZWRVcmx9YClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9KVxuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgdnVlKCksXG4gICAgICB2dWVKc3goKSxcbiAgICAgIGlzdGFuYnVsKHtcbiAgICAgICAgbnljcmNQYXRoOiAnLm55Y3JjJ1xuICAgICAgfSlcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGV4dGVuc2lvbnM6IFsnLm1qcycsICcuanMnLCAnLm10cycsICcudHMnLCAnLmpzeCcsICcudHN4JywgJy5qc29uJywgJy52dWUnXSxcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHRlbXBsYXRlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvdGVtcGxhdGVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAdmlld3MnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3ZpZXdzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAc2VydmljZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3NlcnZpY2VzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAc3RvcmVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9zdG9yZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Bhc3NldHMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL2Fzc2V0cycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHJvdXRlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvcm91dGVyL3JvdXRlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQG1vZHVsZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL21vZHVsZXMnLCBpbXBvcnQubWV0YS51cmwpKVxuICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwcm94eToge1xuICAgICAgICAnXi9hcGkvbWFya2V0cGxhY2UnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYXJrZXRwbGFjZS5hemlvbi5jb20vYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvbWFya2V0cGxhY2UvLCAnL21hcmtldHBsYWNlL2FwaScpXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvc2NyaXB0LXJ1bm5lcic6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXNjcmlwdC1ydW5uZXIuYXppb24uY29tL2AsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3NjcmlwdC1ydW5uZXIvLCAnL3NjcmlwdC1ydW5uZXIvYXBpJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS90ZW1wbGF0ZS1lbmdpbmUnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH10ZW1wbGF0ZS1lbmdpbmUuYXppb24uY29tL2AsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3RlbXBsYXRlLWVuZ2luZS8sICcvdGVtcGxhdGUtZW5naW5lL2FwaScpXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvaWFtJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9aWFtLWFwaS5hemlvbi5uZXQvYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvaWFtLywgJy9pYW0vYXBpJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS92Y3MnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH12Y3MtYXBpLmF6aW9uLm5ldC9gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC92Y3MvLCAnL3Zjcy9hcGknKVxuICAgICAgICB9KSxcbiAgICAgICAgJy9ncmFwaHFsL2NpdGllcyc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWNpdGllcy5hemlvbi4ke0RvbWFpblN1ZmZpeH1gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvY2l0aWVzLywgJy9ncmFwaHFsJylcbiAgICAgICAgfSksXG4gICAgICAgICcvYXBpL3dlYmhvb2svY29uc29sZV9mZWVkYmFjayc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwczovL2F1dG9tYXRlLmF6aW9uLm5ldC8nLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS8oYWNjb3VudHx1c2VyfHRva2VufHN3aXRjaC1hY2NvdW50fGF1dGh8cGFzc3dvcmR8dG90cCl8Xi9sb2dvdXQnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1zc28uYXppb24uY29tYCxcbiAgICAgICAgICBjb29raWVEb21haW5SZXdyaXRlOiB7ICcqJzogJycgfVxuICAgICAgICB9KSxcbiAgICAgICAgJy9hcGknOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1hcGkuYXppb24uY29tYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAnL3Y0JzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YXBpLmF6aW9uLmNvbWBcbiAgICAgICAgfSksXG4gICAgICAgICcvd2VicGFnZXRlc3QnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly93d3cuYXppb24uY29tL2FwaS93ZWJwYWdldGVzdCcsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3dlYnBhZ2V0ZXN0LywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAnL3dlYnBhZ2V0ZXN0LWV4dGVybmFsJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogJ2h0dHBzOi8vd3d3LmF6aW9uLmNvbS9hcGkvd2VicGFnZXRlc3QnLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC93ZWJwYWdldGVzdC1leHRlcm5hbC8sICcnKVxuICAgICAgICB9KSxcbiAgICAgICAgJy9haSc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWFpLmF6aW9uLmNvbS9jb3BpbG90L2NoYXQvY29tcGxldGlvbnNgLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9haS8sICcnKVxuICAgICAgICB9KSxcbiAgICAgICAgJy9ncmFwaHFsL2FjY291bnRpbmcnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1jb25zb2xlLmF6aW9uLmNvbWAsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2dyYXBocWxcXC9hY2NvdW50aW5nLywgJy9hY2NvdW50aW5nL2dyYXBocWwnKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoZ2V0Q29uZmlnKCkpXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFWLFNBQVMsaUJBQUFBLHNCQUFxQjtBQUNuWCxTQUFTLGFBQWEsZ0JBQUFDLHFCQUFvQjtBQUMxQyxTQUFTLHNCQUFzQjs7O0FDRmtULFNBQVMsZUFBZSxPQUFBQyxZQUFXO0FBQ3BYLE9BQU8sYUFBYTtBQUVwQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsY0FBYyxl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
