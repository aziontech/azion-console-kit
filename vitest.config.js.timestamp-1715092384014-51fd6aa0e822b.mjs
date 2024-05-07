// vitest.config.js
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { mergeConfig, defineConfig as defineConfig2 } from "file:///Users/lucas.mendes/Documents/azion/frontend/azion-console-kit/node_modules/vite/dist/node/index.js";
import { configDefaults } from "file:///Users/lucas.mendes/Documents/azion/frontend/azion-console-kit/node_modules/vitest/dist/config.js";

// vite.config.js
import { fileURLToPath, URL as URL2 } from "node:url";
import process from "process";
import vue from "file:///Users/lucas.mendes/Documents/azion/frontend/azion-console-kit/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/lucas.mendes/Documents/azion/frontend/azion-console-kit/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { defineConfig, loadEnv } from "file:///Users/lucas.mendes/Documents/azion/frontend/azion-console-kit/node_modules/vite/dist/node/index.js";
var __vite_injected_original_import_meta_url = "file:///Users/lucas.mendes/Documents/azion/frontend/azion-console-kit/vite.config.js";
var getConfig = () => {
  const env = loadEnv("development", process.cwd());
  const URLStartPrefix = env.VITE_ENVIRONMENT === "PRODUCTION" ? "https://" : "https://stage-";
  return {
    plugins: [vue(), vueJsx()],
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
        "^/api/(marketplace|script-runner|template-engine)": {
          target: `${URLStartPrefix}manager.azion.com/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/(marketplace|script-runner|template-engine)/, "/$1/api")
        },
        "^/api/vcs": {
          target: `${URLStartPrefix}vcs-api.azion.net/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/vcs/, "/vcs/api")
        },
        "/graphql/cities": {
          target: `${URLStartPrefix}cities.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, "/graphql")
        },
        "^/api/(account|user|token|switch-account|auth|password|totp)|^/logout": {
          target: `${URLStartPrefix}sso.azion.com`,
          changeOrigin: true,
          cookieDomainRewrite: { "*": "" }
        },
        "/api": {
          target: `${URLStartPrefix}api.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    }
  };
};
var vite_config_default = defineConfig(getConfig());

// vitest.config.js
var __vite_injected_original_import_meta_url2 = "file:///Users/lucas.mendes/Documents/azion/frontend/azion-console-kit/vitest.config.js";
var vitest_config_default = mergeConfig(
  vite_config_default,
  defineConfig2({
    test: {
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
        statements: 91,
        branches: 91,
        functions: 91,
        lines: 91,
        reporter: ["text", "lcov", "html"]
      },
      reporters: ["default", "vitest-sonar-reporter"],
      outputFile: {
        "vitest-sonar-reporter": "./coverage/sonar-report.xml"
      },
      testTimeout: 3e4
    }
  })
);
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyIsICJ2aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9sdWNhcy5tZW5kZXMvRG9jdW1lbnRzL2F6aW9uL2Zyb250ZW5kL2F6aW9uLWNvbnNvbGUta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbHVjYXMubWVuZGVzL0RvY3VtZW50cy9hemlvbi9mcm9udGVuZC9hemlvbi1jb25zb2xlLWtpdC92aXRlc3QuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9sdWNhcy5tZW5kZXMvRG9jdW1lbnRzL2F6aW9uL2Zyb250ZW5kL2F6aW9uLWNvbnNvbGUta2l0L3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBtZXJnZUNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGNvbmZpZ0RlZmF1bHRzIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gJy4vdml0ZS5jb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgICAgcGFzc1dpdGhOb1Rlc3RzOiB0cnVlLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAuLi5jb25maWdEZWZhdWx0cy5leGNsdWRlLFxuICAgICAgICAnZTJlLyonLFxuICAgICAgICAnY3lwcmVzcycsXG4gICAgICAgICdhemlvbicsXG4gICAgICAgICcudnNjb2RlJyxcbiAgICAgICAgJy5odXNreScsXG4gICAgICAgICcudml0ZScsXG4gICAgICAgICcuZ2l0aHViJyxcbiAgICAgICAgJ2RvY3MnLFxuICAgICAgICAncHVibGljJ1xuICAgICAgXSxcbiAgICAgIHJvb3Q6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi8nLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgIHRyYW5zZm9ybU1vZGU6IHtcbiAgICAgICAgd2ViOiBbL1xcLltqdF1zeCQvXVxuICAgICAgfSxcbiAgICAgIGNvdmVyYWdlOiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgICAnc3JjL3NlcnZpY2VzLyoqJyxcbiAgICAgICAgICAnc3JjL3ZpZXdzLyoqJyxcbiAgICAgICAgICAnc3JjL2hlbHBlcnMvKionLFxuICAgICAgICAgICdzcmMvcGx1Z2lucy8qKicsXG4gICAgICAgICAgJ3NyYy9tb2R1bGVzLyoqJ1xuICAgICAgICBdLFxuICAgICAgICBzdGF0ZW1lbnRzOiA5MSxcbiAgICAgICAgYnJhbmNoZXM6IDkxLFxuICAgICAgICBmdW5jdGlvbnM6IDkxLFxuICAgICAgICBsaW5lczogOTEsXG4gICAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnbGNvdicsICdodG1sJ11cbiAgICAgIH0sXG4gICAgICByZXBvcnRlcnM6IFsnZGVmYXVsdCcsICd2aXRlc3Qtc29uYXItcmVwb3J0ZXInXSxcbiAgICAgIG91dHB1dEZpbGU6IHtcbiAgICAgICAgJ3ZpdGVzdC1zb25hci1yZXBvcnRlcic6ICcuL2NvdmVyYWdlL3NvbmFyLXJlcG9ydC54bWwnXG4gICAgICB9LFxuICAgICAgdGVzdFRpbWVvdXQ6IDMwMDAwXG4gICAgfVxuICB9KVxuKVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbHVjYXMubWVuZGVzL0RvY3VtZW50cy9hemlvbi9mcm9udGVuZC9hemlvbi1jb25zb2xlLWtpdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2x1Y2FzLm1lbmRlcy9Eb2N1bWVudHMvYXppb24vZnJvbnRlbmQvYXppb24tY29uc29sZS1raXQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2x1Y2FzLm1lbmRlcy9Eb2N1bWVudHMvYXppb24vZnJvbnRlbmQvYXppb24tY29uc29sZS1raXQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnXG5cbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcblxuY29uc3QgZ2V0Q29uZmlnID0gKCkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KCdkZXZlbG9wbWVudCcsIHByb2Nlc3MuY3dkKCkpXG4gIGNvbnN0IFVSTFN0YXJ0UHJlZml4ID0gZW52LlZJVEVfRU5WSVJPTk1FTlQgPT09ICdQUk9EVUNUSU9OJyA/ICdodHRwczovLycgOiAnaHR0cHM6Ly9zdGFnZS0nXG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbdnVlKCksIHZ1ZUpzeCgpXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBleHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJywgJy5tdHMnLCAnLnRzJywgJy5qc3gnLCAnLnRzeCcsICcuanNvbicsICcudnVlJ10sXG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0B0ZW1wbGF0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3RlbXBsYXRlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHZpZXdzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy92aWV3cycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHNlcnZpY2VzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9zZXJ2aWNlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHN0b3Jlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc3RvcmVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAYXNzZXRzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9hc3NldHMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Byb3V0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3JvdXRlci9yb3V0ZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Btb2R1bGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9tb2R1bGVzJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcHJveHk6IHtcbiAgICAgICAgJ14vYXBpLyhtYXJrZXRwbGFjZXxzY3JpcHQtcnVubmVyfHRlbXBsYXRlLWVuZ2luZSknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYW5hZ2VyLmF6aW9uLmNvbS9gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT5cbiAgICAgICAgICAgIHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcLyhtYXJrZXRwbGFjZXxzY3JpcHQtcnVubmVyfHRlbXBsYXRlLWVuZ2luZSkvLCAnLyQxL2FwaScpXG4gICAgICAgIH0sXG4gICAgICAgICdeL2FwaS92Y3MnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH12Y3MtYXBpLmF6aW9uLm5ldC9gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT5cbiAgICAgICAgICAgIHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3Zjcy8sICcvdmNzL2FwaScpXG4gICAgICAgIH0sXG4gICAgICAgICcvZ3JhcGhxbC9jaXRpZXMnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1jaXRpZXMuYXppb24uY29tYCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2dyYXBocWxcXC9jaXRpZXMvLCAnL2dyYXBocWwnKVxuICAgICAgICB9LFxuICAgICAgICAnXi9hcGkvKGFjY291bnR8dXNlcnx0b2tlbnxzd2l0Y2gtYWNjb3VudHxhdXRofHBhc3N3b3JkfHRvdHApfF4vbG9nb3V0Jzoge1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9c3NvLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIGNvb2tpZURvbWFpblJld3JpdGU6IHsgJyonOiAnJyB9XG4gICAgICAgIH0sXG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YXBpLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoZ2V0Q29uZmlnKCkpXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdYLFNBQVMsaUJBQUFBLHNCQUFx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LFFBQ2IsS0FBSyxDQUFDLFdBQVc7QUFBQSxNQUNuQjtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1IsU0FBUztBQUFBLFFBQ1QsU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLFFBQ0EsWUFBWTtBQUFBLFFBQ1osVUFBVTtBQUFBLFFBQ1YsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDbkM7QUFBQSxNQUNBLFdBQVcsQ0FBQyxXQUFXLHVCQUF1QjtBQUFBLE1BQzlDLFlBQVk7QUFBQSxRQUNWLHlCQUF5QjtBQUFBLE1BQzNCO0FBQUEsTUFDQSxhQUFhO0FBQUEsSUFDZjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJmaWxlVVJMVG9QYXRoIiwgImRlZmluZUNvbmZpZyIsICJVUkwiLCAiVVJMIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwiLCAiZGVmaW5lQ29uZmlnIiwgImZpbGVVUkxUb1BhdGgiXQp9Cg==
