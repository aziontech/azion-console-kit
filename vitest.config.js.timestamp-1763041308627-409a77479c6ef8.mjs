// vitest.config.js
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { mergeConfig, defineConfig as defineConfig2 } from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/vite/dist/node/index.js";
import { configDefaults } from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/vitest/dist/config.js";

// vite.config.js
import { fileURLToPath, URL as URL2 } from "node:url";
import process from "process";
import vue from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { defineConfig, loadEnv } from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/vite/dist/node/index.js";
import istanbul from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/vite-plugin-istanbul/dist/index.mjs";
import { sentryVitePlugin } from "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/vite.config.js";
var getConfig = () => {
  var _a;
  const env = loadEnv("development", process.cwd());
  const IS_SENTRY_UPLOAD = env.VITE_SENTRY_UPLOAD === "true";
  const IS_PROD = env.VITE_ENVIRONMENT === "production";
  const URLStartPrefix = IS_PROD ? "https://" : "https://stage-";
  const DomainSuffix = IS_PROD ? "net" : "com";
  const DEBUG_PROXY = env.VITE_DEBUG_PROXY === "true" && !IS_PROD;
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
    build: {
      sourcemap: IS_SENTRY_UPLOAD ? "hidden" : "inline"
    },
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    },
    plugins: [
      vue(),
      vueJsx(),
      istanbul({
        nycrcPath: ".nycrc"
      }),
      ...IS_SENTRY_UPLOAD && ((_a = env.VITE_SENTRY_AUTH_TOKEN) == null ? void 0 : _a.length) ? [
        sentryVitePlugin({
          org: "azion-technologies",
          project: IS_PROD ? "console" : "console-stage",
          authToken: env.VITE_SENTRY_AUTH_TOKEN,
          sourcemaps: { assets: "./dist/assets/**" }
        })
      ] : []
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
        "@modules": fileURLToPath(new URL2("./src/modules", __vite_injected_original_import_meta_url)),
        "@utils": fileURLToPath(new URL2("./src/utils", __vite_injected_original_import_meta_url))
      }
    },
    server: {
      host: true,
      historyApiFallback: true,
      proxy: {
        // Knowledge Base API - MUST be first to avoid conflicts with generic /api rule
        "^/api/v4/workspace/ai/kbs": createProxyConfig({
          target: `${URLStartPrefix}api.azion.com/`,
          rewrite: (path) => path.replace(/^\/api/, "")
        }),
        // Knowledge Base API (direct v4 paths) - Fallback for direct calls
        "^/v4/workspace/ai/kbs": createProxyConfig({
          target: `${URLStartPrefix}api.azion.com/`
        }),
        // AI Studio API - MUST come after KB to avoid conflicts
        "^/api/v4/workspace/ai": createProxyConfig({
          target: `${URLStartPrefix}ai-studio-api.azion.net/`,
          rewrite: (path) => path.replace(/^\/api/, "")
        }),
        // AI Studio API (direct v4 paths) - Fallback for direct calls
        "^/v4/workspace/ai": createProxyConfig({
          target: `${URLStartPrefix}ai-studio-api.azion.net/`
        }),
        "^/api/marketplace": createProxyConfig({
          target: `${URLStartPrefix}marketplace.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/marketplace/, "/marketplace/api")
        }),
        "^/api/script-runner": createProxyConfig({
          target: `${URLStartPrefix}script-runner.azion.${DomainSuffix}/`,
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

// vitest.config.js
var __vite_injected_original_import_meta_url2 = "file:///Users/alessandro.cauduro/projects/azion-console-aistudio/vitest.config.js";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyIsICJ2aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9hbGVzc2FuZHJvLmNhdWR1cm8vcHJvamVjdHMvYXppb24tY29uc29sZS1haXN0dWRpb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2FsZXNzYW5kcm8uY2F1ZHVyby9wcm9qZWN0cy9hemlvbi1jb25zb2xlLWFpc3R1ZGlvL3ZpdGVzdC5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2FsZXNzYW5kcm8uY2F1ZHVyby9wcm9qZWN0cy9hemlvbi1jb25zb2xlLWFpc3R1ZGlvL3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBtZXJnZUNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGNvbmZpZ0RlZmF1bHRzIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gJy4vdml0ZS5jb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIHNldHVwRmlsZXM6IFsnc3JjL3Rlc3RzL3NldHVwLXRlc3RzLmpzJ10sXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICAgIHBhc3NXaXRoTm9UZXN0czogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgLi4uY29uZmlnRGVmYXVsdHMuZXhjbHVkZSxcbiAgICAgICAgJ2UyZS8qJyxcbiAgICAgICAgJ2N5cHJlc3MnLFxuICAgICAgICAnYXppb24nLFxuICAgICAgICAnLnZzY29kZScsXG4gICAgICAgICcuaHVza3knLFxuICAgICAgICAnLnZpdGUnLFxuICAgICAgICAnLmdpdGh1YicsXG4gICAgICAgICdkb2NzJyxcbiAgICAgICAgJ3B1YmxpYydcbiAgICAgIF0sXG4gICAgICByb290OiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICB0cmFuc2Zvcm1Nb2RlOiB7XG4gICAgICAgIHdlYjogWy9cXC5banRdc3gkL11cbiAgICAgIH0sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBpbmNsdWRlOiBbXG4gICAgICAgICAgJ3NyYy9zZXJ2aWNlcy8qKicsXG4gICAgICAgICAgJ3NyYy92aWV3cy8qKicsXG4gICAgICAgICAgJ3NyYy9oZWxwZXJzLyoqJyxcbiAgICAgICAgICAnc3JjL3BsdWdpbnMvKionLFxuICAgICAgICAgICdzcmMvbW9kdWxlcy8qKidcbiAgICAgICAgXSxcbiAgICAgICAgc3RhdGVtZW50czogNTAsXG4gICAgICAgIGJyYW5jaGVzOiA1MCxcbiAgICAgICAgZnVuY3Rpb25zOiA1MCxcbiAgICAgICAgbGluZXM6IDUwLFxuICAgICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2xjb3YnLCAnaHRtbCddLFxuICAgICAgICByZXBvcnRzRGlyZWN0b3J5OiAnLi9jb3ZlcmFnZS91bml0JyxcbiAgICAgIH0sXG4gICAgICByZXBvcnRlcnM6IFsnZGVmYXVsdCcsICd2aXRlc3Qtc29uYXItcmVwb3J0ZXInXSxcbiAgICAgIG91dHB1dEZpbGU6IHtcbiAgICAgICAgJ3ZpdGVzdC1zb25hci1yZXBvcnRlcic6ICcuL2NvdmVyYWdlL3VuaXQvc29uYXItcmVwb3J0LnhtbCdcbiAgICAgIH0sXG4gICAgICB0ZXN0VGltZW91dDogMzAwMDBcbiAgICB9XG4gIH0pXG4pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9hbGVzc2FuZHJvLmNhdWR1cm8vcHJvamVjdHMvYXppb24tY29uc29sZS1haXN0dWRpb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2FsZXNzYW5kcm8uY2F1ZHVyby9wcm9qZWN0cy9hemlvbi1jb25zb2xlLWFpc3R1ZGlvL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9hbGVzc2FuZHJvLmNhdWR1cm8vcHJvamVjdHMvYXppb24tY29uc29sZS1haXN0dWRpby92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAncHJvY2VzcydcblxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IGlzdGFuYnVsIGZyb20gJ3ZpdGUtcGx1Z2luLWlzdGFuYnVsJ1xuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nXG5cbmNvbnN0IGdldENvbmZpZyA9ICgpID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudignZGV2ZWxvcG1lbnQnLCBwcm9jZXNzLmN3ZCgpKVxuICBjb25zdCBJU19TRU5UUllfVVBMT0FEID0gZW52LlZJVEVfU0VOVFJZX1VQTE9BRCA9PT0gJ3RydWUnXG4gIGNvbnN0IElTX1BST0QgPSBlbnYuVklURV9FTlZJUk9OTUVOVCA9PT0gJ3Byb2R1Y3Rpb24nXG4gIGNvbnN0IFVSTFN0YXJ0UHJlZml4ID0gSVNfUFJPRCA/ICdodHRwczovLycgOiAnaHR0cHM6Ly9zdGFnZS0nXG4gIGNvbnN0IERvbWFpblN1ZmZpeCA9IElTX1BST0QgPyAnbmV0JyA6ICdjb20nXG4gIGNvbnN0IERFQlVHX1BST1hZID0gZW52LlZJVEVfREVCVUdfUFJPWFkgPT09ICd0cnVlJyAmJiAhSVNfUFJPRFxuXG4gIGNvbnN0IGNyZWF0ZVByb3h5Q29uZmlnID0gKHsgdGFyZ2V0LCByZXdyaXRlLCBjaGFuZ2VPcmlnaW4gPSB0cnVlLCBjb29raWVEb21haW5SZXdyaXRlIH0pID0+ICh7XG4gICAgdGFyZ2V0LFxuICAgIGNoYW5nZU9yaWdpbixcbiAgICAuLi4ocmV3cml0ZSAmJiB7IHJld3JpdGUgfSksXG4gICAgLi4uKGNvb2tpZURvbWFpblJld3JpdGUgJiYgeyBjb29raWVEb21haW5SZXdyaXRlIH0pLFxuICAgIC4uLihERUJVR19QUk9YWSAmJiB7XG4gICAgICBjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xuICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSkgPT4ge1xuICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVXJsID0gYGh0dHBzOi8vJHtyZXEuaGVhZGVycy5ob3N0fSR7cmVxLnVybH1gXG4gICAgICAgICAgY29uc3QgdGFyZ2V0VXJsID0gb3B0aW9ucy50YXJnZXRcbiAgICAgICAgICBjb25zdCBwcm94aWVkVXJsID0gYCR7dGFyZ2V0VXJsfSR7cmVxLnVybH1gXG5cbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbVml0ZSBQcm94eV0gJHtyZXEubWV0aG9kfSAke29yaWdpbmFsVXJsfSA9PiAke3Byb3hpZWRVcmx9YClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9KVxuXG4gIHJldHVybiB7XG4gICAgYnVpbGQ6IHtcbiAgICAgIHNvdXJjZW1hcDogSVNfU0VOVFJZX1VQTE9BRCA/ICdoaWRkZW4nIDogJ2lubGluZSdcbiAgICB9LFxuICAgIGRlZmluZToge1xuICAgICAgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fOiBmYWxzZVxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgdnVlKCksXG4gICAgICB2dWVKc3goKSxcbiAgICAgIGlzdGFuYnVsKHtcbiAgICAgICAgbnljcmNQYXRoOiAnLm55Y3JjJ1xuICAgICAgfSksXG4gICAgICAuLi4oSVNfU0VOVFJZX1VQTE9BRCAmJiBlbnYuVklURV9TRU5UUllfQVVUSF9UT0tFTj8ubGVuZ3RoXG4gICAgICAgID8gW1xuICAgICAgICAgICAgc2VudHJ5Vml0ZVBsdWdpbih7XG4gICAgICAgICAgICAgIG9yZzogJ2F6aW9uLXRlY2hub2xvZ2llcycsXG4gICAgICAgICAgICAgIHByb2plY3Q6IElTX1BST0QgPyAnY29uc29sZScgOiAnY29uc29sZS1zdGFnZScsXG4gICAgICAgICAgICAgIGF1dGhUb2tlbjogZW52LlZJVEVfU0VOVFJZX0FVVEhfVE9LRU4sXG4gICAgICAgICAgICAgIHNvdXJjZW1hcHM6IHsgYXNzZXRzOiAnLi9kaXN0L2Fzc2V0cy8qKicgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICBdXG4gICAgICAgIDogW10pXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBleHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJywgJy5tdHMnLCAnLnRzJywgJy5qc3gnLCAnLnRzeCcsICcuanNvbicsICcudnVlJ10sXG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0B0ZW1wbGF0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3RlbXBsYXRlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHZpZXdzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy92aWV3cycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHNlcnZpY2VzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9zZXJ2aWNlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHN0b3Jlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc3RvcmVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAYXNzZXRzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9hc3NldHMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Byb3V0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3JvdXRlci9yb3V0ZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Btb2R1bGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9tb2R1bGVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAdXRpbHMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3V0aWxzJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogdHJ1ZSxcbiAgICAgIGhpc3RvcnlBcGlGYWxsYmFjazogdHJ1ZSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgIC8vIEtub3dsZWRnZSBCYXNlIEFQSSAtIE1VU1QgYmUgZmlyc3QgdG8gYXZvaWQgY29uZmxpY3RzIHdpdGggZ2VuZXJpYyAvYXBpIHJ1bGVcbiAgICAgICAgJ14vYXBpL3Y0L3dvcmtzcGFjZS9haS9rYnMnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1hcGkuYXppb24uY29tL2AsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKVxuICAgICAgICB9KSxcbiAgICAgICAgLy8gS25vd2xlZGdlIEJhc2UgQVBJIChkaXJlY3QgdjQgcGF0aHMpIC0gRmFsbGJhY2sgZm9yIGRpcmVjdCBjYWxsc1xuICAgICAgICAnXi92NC93b3Jrc3BhY2UvYWkva2JzJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YXBpLmF6aW9uLmNvbS9gXG4gICAgICAgIH0pLFxuICAgICAgICAvLyBBSSBTdHVkaW8gQVBJIC0gTVVTVCBjb21lIGFmdGVyIEtCIHRvIGF2b2lkIGNvbmZsaWN0c1xuICAgICAgICAnXi9hcGkvdjQvd29ya3NwYWNlL2FpJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YWktc3R1ZGlvLWFwaS5hemlvbi5uZXQvYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAvLyBBSSBTdHVkaW8gQVBJIChkaXJlY3QgdjQgcGF0aHMpIC0gRmFsbGJhY2sgZm9yIGRpcmVjdCBjYWxsc1xuICAgICAgICAnXi92NC93b3Jrc3BhY2UvYWknOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1haS1zdHVkaW8tYXBpLmF6aW9uLm5ldC9gXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvbWFya2V0cGxhY2UnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYXJrZXRwbGFjZS5hemlvbi5jb20vYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvbWFya2V0cGxhY2UvLCAnL21hcmtldHBsYWNlL2FwaScpXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvc2NyaXB0LXJ1bm5lcic6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXNjcmlwdC1ydW5uZXIuYXppb24uJHtEb21haW5TdWZmaXh9L2AsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3NjcmlwdC1ydW5uZXIvLCAnL3NjcmlwdC1ydW5uZXIvYXBpJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS90ZW1wbGF0ZS1lbmdpbmUnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH10ZW1wbGF0ZS1lbmdpbmUuYXppb24uY29tL2AsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3RlbXBsYXRlLWVuZ2luZS8sICcvdGVtcGxhdGUtZW5naW5lL2FwaScpXG4gICAgICAgIH0pLFxuICAgICAgICAnXi9hcGkvaWFtJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9aWFtLWFwaS5hemlvbi5uZXQvYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvaWFtLywgJy9pYW0vYXBpJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS92Y3MnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH12Y3MtYXBpLmF6aW9uLm5ldC9gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC92Y3MvLCAnL3Zjcy9hcGknKVxuICAgICAgICB9KSxcbiAgICAgICAgJy9ncmFwaHFsL2NpdGllcyc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWNpdGllcy5hemlvbi4ke0RvbWFpblN1ZmZpeH1gLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvY2l0aWVzLywgJy9ncmFwaHFsJylcbiAgICAgICAgfSksXG4gICAgICAgICcvYXBpL3dlYmhvb2svY29uc29sZV9mZWVkYmFjayc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwczovL2F1dG9tYXRlLmF6aW9uLm5ldC8nLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgfSksXG4gICAgICAgICdeL2FwaS8oYWNjb3VudHx1c2VyfHRva2VufHN3aXRjaC1hY2NvdW50fGF1dGh8cGFzc3dvcmR8dG90cCl8Xi9sb2dvdXQnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1zc28uYXppb24uY29tYCxcbiAgICAgICAgICBjb29raWVEb21haW5SZXdyaXRlOiB7ICcqJzogJycgfVxuICAgICAgICB9KSxcbiAgICAgICAgJy9hcGknOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1hcGkuYXppb24uY29tYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAnL3Y0JzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YXBpLmF6aW9uLmNvbWBcbiAgICAgICAgfSksXG4gICAgICAgICcvd2VicGFnZXRlc3QnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly93d3cuYXppb24uY29tL2FwaS93ZWJwYWdldGVzdCcsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3dlYnBhZ2V0ZXN0LywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAnL3dlYnBhZ2V0ZXN0LWV4dGVybmFsJzogY3JlYXRlUHJveHlDb25maWcoe1xuICAgICAgICAgIHRhcmdldDogJ2h0dHBzOi8vd3d3LmF6aW9uLmNvbS9hcGkvd2VicGFnZXRlc3QnLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC93ZWJwYWdldGVzdC1leHRlcm5hbC8sICcnKVxuICAgICAgICB9KSxcbiAgICAgICAgJ14vYXBpL2FpL2NvcGlsb3QnOiBjcmVhdGVQcm94eUNvbmZpZyh7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1haS5hemlvbi5jb20vY29waWxvdC9jaGF0L2NvbXBsZXRpb25zYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvYWlcXC9jb3BpbG90LywgJycpXG4gICAgICAgIH0pLFxuICAgICAgICAnL2dyYXBocWwvYWNjb3VudGluZyc6IGNyZWF0ZVByb3h5Q29uZmlnKHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWNvbnNvbGUuYXppb24uY29tYCxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvZ3JhcGhxbFxcL2FjY291bnRpbmcvLCAnL2FjY291bnRpbmcvZ3JhcGhxbCcpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhnZXRDb25maWcoKSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVcsU0FBUyxpQkFBQUEsc0JBQXFCO0FBQy9YLFNBQVMsYUFBYSxnQkFBQUMscUJBQW9CO0FBQzFDLFNBQVMsc0JBQXNCOzs7QUNGOFQsU0FBUyxlQUFlLE9BQUFDLFlBQVc7QUFDaFksT0FBTyxhQUFhO0FBRXBCLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxjQUFj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O0FBQUEsUUFDakYsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhLFVBQVUsQ0FBQzs7O0FENUpxTCxJQUFNQyw0Q0FBMkM7QUFLN1EsSUFBTyx3QkFBUTtBQUFBLEVBQ2I7QUFBQSxFQUNBQyxjQUFhO0FBQUEsSUFDWCxNQUFNO0FBQUEsTUFDSixZQUFZLENBQUMsMEJBQTBCO0FBQUEsTUFDdkMsYUFBYTtBQUFBLE1BQ2IsaUJBQWlCO0FBQUEsTUFDakIsU0FBUztBQUFBLFFBQ1AsR0FBRyxlQUFlO0FBQUEsUUFDbEI7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLE1BQU1DLGVBQWMsSUFBSSxJQUFJLE1BQU1GLHlDQUFlLENBQUM7QUFBQSxNQUNsRCxlQUFlO0FBQUEsUUFDYixLQUFLLENBQUMsV0FBVztBQUFBLE1BQ25CO0FBQUEsTUFDQSxVQUFVO0FBQUEsUUFDUixTQUFTO0FBQUEsUUFDVCxTQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsUUFDQSxZQUFZO0FBQUEsUUFDWixVQUFVO0FBQUEsUUFDVixXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsUUFDUCxVQUFVLENBQUMsUUFBUSxRQUFRLE1BQU07QUFBQSxRQUNqQyxrQkFBa0I7QUFBQSxNQUNwQjtBQUFBLE1BQ0EsV0FBVyxDQUFDLFdBQVcsdUJBQXVCO0FBQUEsTUFDOUMsWUFBWTtBQUFBLFFBQ1YseUJBQXlCO0FBQUEsTUFDM0I7QUFBQSxNQUNBLGFBQWE7QUFBQSxJQUNmO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbImZpbGVVUkxUb1BhdGgiLCAiZGVmaW5lQ29uZmlnIiwgIlVSTCIsICJVUkwiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCIsICJkZWZpbmVDb25maWciLCAiZmlsZVVSTFRvUGF0aCJdCn0K
