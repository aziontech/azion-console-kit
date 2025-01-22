// vitest.config.js
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { mergeConfig, defineConfig as defineConfig2 } from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/vite/dist/node/index.js";
import { configDefaults } from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/vitest/dist/config.js";

// vite.config.js
import { fileURLToPath, URL as URL2 } from "node:url";
import process from "process";
import vue from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { defineConfig, loadEnv } from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/vite/dist/node/index.js";
import istanbul from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/vite-plugin-istanbul/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/vite.config.js";
var getConfig = () => {
  const env = loadEnv("development", process.cwd());
  const URLStartPrefix = env.VITE_ENVIRONMENT === "production" ? "https://" : "https://stage-";
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
        "^/api/(marketplace|script-runner|template-engine|iam)": {
          target: `${URLStartPrefix}manager.azion.com/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/(marketplace|script-runner|template-engine|iam)/, "/$1/api")
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
        "/graphql/billing": {
          target: `${URLStartPrefix}manager.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/billing/, "/billing/graphql")
        },
        "/api/webhook/console_feedback": {
          target: `https://automate.azion.net/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
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
        },
        "/webpagetest": {
          target: `https://www.azion.com/api/webpagetest`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/webpagetest/, "")
        },
        "/webpagetest-external": {
          target: `https://www.azion.com/api/webpagetest`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/webpagetest-external/, "")
        },
        "/ai": {
          target: `${URLStartPrefix}ai.azion.com/copilot/chat/completions`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai/, "")
        },
        "/graphql/accounting": {
          target: `${URLStartPrefix}manager.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/accounting/, "/accounting/graphql")
        }
      }
    }
  };
};
var vite_config_default = defineConfig(getConfig());

// vitest.config.js
var __vite_injected_original_import_meta_url2 = "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/vitest.config.js";
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
        statements: 91,
        branches: 91,
        functions: 91,
        lines: 91,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyIsICJ2aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wYXVsby5mZXJyZWlyYS9Eb2N1bWVudHMvQXppb24vYXppb24tcGxhdGZvcm0ta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGF1bG8uZmVycmVpcmEvRG9jdW1lbnRzL0F6aW9uL2F6aW9uLXBsYXRmb3JtLWtpdC92aXRlc3QuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9wYXVsby5mZXJyZWlyYS9Eb2N1bWVudHMvQXppb24vYXppb24tcGxhdGZvcm0ta2l0L3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBtZXJnZUNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGNvbmZpZ0RlZmF1bHRzIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gJy4vdml0ZS5jb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIHNldHVwRmlsZXM6IFsnc3JjL3Rlc3RzL3NldHVwLXRlc3RzLmpzJ10sXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICAgIHBhc3NXaXRoTm9UZXN0czogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgLi4uY29uZmlnRGVmYXVsdHMuZXhjbHVkZSxcbiAgICAgICAgJ2UyZS8qJyxcbiAgICAgICAgJ2N5cHJlc3MnLFxuICAgICAgICAnYXppb24nLFxuICAgICAgICAnLnZzY29kZScsXG4gICAgICAgICcuaHVza3knLFxuICAgICAgICAnLnZpdGUnLFxuICAgICAgICAnLmdpdGh1YicsXG4gICAgICAgICdkb2NzJyxcbiAgICAgICAgJ3B1YmxpYydcbiAgICAgIF0sXG4gICAgICByb290OiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICB0cmFuc2Zvcm1Nb2RlOiB7XG4gICAgICAgIHdlYjogWy9cXC5banRdc3gkL11cbiAgICAgIH0sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBpbmNsdWRlOiBbXG4gICAgICAgICAgJ3NyYy9zZXJ2aWNlcy8qKicsXG4gICAgICAgICAgJ3NyYy92aWV3cy8qKicsXG4gICAgICAgICAgJ3NyYy9oZWxwZXJzLyoqJyxcbiAgICAgICAgICAnc3JjL3BsdWdpbnMvKionLFxuICAgICAgICAgICdzcmMvbW9kdWxlcy8qKidcbiAgICAgICAgXSxcbiAgICAgICAgc3RhdGVtZW50czogOTEsXG4gICAgICAgIGJyYW5jaGVzOiA5MSxcbiAgICAgICAgZnVuY3Rpb25zOiA5MSxcbiAgICAgICAgbGluZXM6IDkxLFxuICAgICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2xjb3YnLCAnaHRtbCddLFxuICAgICAgICByZXBvcnRzRGlyZWN0b3J5OiAnLi9jb3ZlcmFnZS91bml0JyxcbiAgICAgIH0sXG4gICAgICByZXBvcnRlcnM6IFsnZGVmYXVsdCcsICd2aXRlc3Qtc29uYXItcmVwb3J0ZXInXSxcbiAgICAgIG91dHB1dEZpbGU6IHtcbiAgICAgICAgJ3ZpdGVzdC1zb25hci1yZXBvcnRlcic6ICcuL2NvdmVyYWdlL3VuaXQvc29uYXItcmVwb3J0LnhtbCdcbiAgICAgIH0sXG4gICAgICB0ZXN0VGltZW91dDogMzAwMDBcbiAgICB9XG4gIH0pXG4pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wYXVsby5mZXJyZWlyYS9Eb2N1bWVudHMvQXppb24vYXppb24tcGxhdGZvcm0ta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGF1bG8uZmVycmVpcmEvRG9jdW1lbnRzL0F6aW9uL2F6aW9uLXBsYXRmb3JtLWtpdC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGF1bG8uZmVycmVpcmEvRG9jdW1lbnRzL0F6aW9uL2F6aW9uLXBsYXRmb3JtLWtpdC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAncHJvY2VzcydcblxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IGlzdGFuYnVsIGZyb20gJ3ZpdGUtcGx1Z2luLWlzdGFuYnVsJ1xuXG5jb25zdCBnZXRDb25maWcgPSAoKSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYoJ2RldmVsb3BtZW50JywgcHJvY2Vzcy5jd2QoKSlcbiAgY29uc3QgVVJMU3RhcnRQcmVmaXggPSBlbnYuVklURV9FTlZJUk9OTUVOVCA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2h0dHBzOi8vJyA6ICdodHRwczovL3N0YWdlLSdcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtcbiAgICAgIHZ1ZSgpLFxuICAgICAgdnVlSnN4KCksXG4gICAgICBpc3RhbmJ1bCh7XG4gICAgICAgIG55Y3JjUGF0aDogJy5ueWNyYydcbiAgICAgIH0pXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBleHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJywgJy5tdHMnLCAnLnRzJywgJy5qc3gnLCAnLnRzeCcsICcuanNvbicsICcudnVlJ10sXG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0B0ZW1wbGF0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3RlbXBsYXRlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHZpZXdzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy92aWV3cycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHNlcnZpY2VzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9zZXJ2aWNlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHN0b3Jlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc3RvcmVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAYXNzZXRzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9hc3NldHMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Byb3V0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3JvdXRlci9yb3V0ZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Btb2R1bGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9tb2R1bGVzJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcHJveHk6IHtcbiAgICAgICAgJ14vYXBpLyhtYXJrZXRwbGFjZXxzY3JpcHQtcnVubmVyfHRlbXBsYXRlLWVuZ2luZXxpYW0pJzoge1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9bWFuYWdlci5hemlvbi5jb20vYCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+XG4gICAgICAgICAgICBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC8obWFya2V0cGxhY2V8c2NyaXB0LXJ1bm5lcnx0ZW1wbGF0ZS1lbmdpbmV8aWFtKS8sICcvJDEvYXBpJylcbiAgICAgICAgfSxcbiAgICAgICAgJ14vYXBpL3Zjcyc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXZjcy1hcGkuYXppb24ubmV0L2AsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC92Y3MvLCAnL3Zjcy9hcGknKVxuICAgICAgICB9LFxuICAgICAgICAnL2dyYXBocWwvY2l0aWVzJzoge1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9Y2l0aWVzLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvY2l0aWVzLywgJy9ncmFwaHFsJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9ncmFwaHFsL2JpbGxpbmcnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYW5hZ2VyLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvYmlsbGluZy8sICcvYmlsbGluZy9ncmFwaHFsJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9hcGkvd2ViaG9vay9jb25zb2xlX2ZlZWRiYWNrJzoge1xuICAgICAgICAgIHRhcmdldDogYGh0dHBzOi8vYXV0b21hdGUuYXppb24ubmV0L2AsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgfSxcbiAgICAgICAgJ14vYXBpLyhhY2NvdW50fHVzZXJ8dG9rZW58c3dpdGNoLWFjY291bnR8YXV0aHxwYXNzd29yZHx0b3RwKXxeL2xvZ291dCc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXNzby5hemlvbi5jb21gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBjb29raWVEb21haW5SZXdyaXRlOiB7ICcqJzogJycgfVxuICAgICAgICB9LFxuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWFwaS5hemlvbi5jb21gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH0sXG4gICAgICAgICcvd2VicGFnZXRlc3QnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgaHR0cHM6Ly93d3cuYXppb24uY29tL2FwaS93ZWJwYWdldGVzdGAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC93ZWJwYWdldGVzdC8sICcnKVxuICAgICAgICB9LFxuICAgICAgICAnL3dlYnBhZ2V0ZXN0LWV4dGVybmFsJzoge1xuICAgICAgICAgIHRhcmdldDogYGh0dHBzOi8vd3d3LmF6aW9uLmNvbS9hcGkvd2VicGFnZXRlc3RgLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvd2VicGFnZXRlc3QtZXh0ZXJuYWwvLCAnJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9haSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWFpLmF6aW9uLmNvbS9jb3BpbG90L2NoYXQvY29tcGxldGlvbnNgLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYWkvLCAnJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9ncmFwaHFsL2FjY291bnRpbmcnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYW5hZ2VyLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvYWNjb3VudGluZy8sICcvYWNjb3VudGluZy9ncmFwaHFsJylcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGdldENvbmZpZygpKVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VixTQUFTLGlCQUFBQSxzQkFBcUI7QUFDNVgsU0FBUyxhQUFhLGdCQUFBQyxxQkFBb0I7QUFDMUMsU0FBUyxzQkFBc0I7OztBQ0YyVCxTQUFTLGVBQWUsT0FBQUMsWUFBVztBQUM3WCxPQUFPLGFBQWE7QUFFcEIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUNuQixTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLGNBQWM7QUFObU0sSUFBTSwyQ0FBMkM7QUFRelEsSUFBTSxZQUFZLE1BQU07QUFDdEIsUUFBTSxNQUFNLFFBQVEsZUFBZSxRQUFRLElBQUksQ0FBQztBQUNoRCxRQUFNLGlCQUFpQixJQUFJLHFCQUFxQixlQUFlLGFBQWE7QUFFNUUsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsSUFBSTtBQUFBLE1BQ0osT0FBTztBQUFBLE1BQ1AsU0FBUztBQUFBLFFBQ1AsV0FB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QUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWEsVUFBVSxDQUFDOzs7QURoR21MLElBQU1DLDRDQUEyQztBQUszUSxJQUFPLHdCQUFRO0FBQUEsRUFDYjtBQUFBLEVBQ0FDLGNBQWE7QUFBQSxJQUNYLE1BQU07QUFBQSxNQUNKLFlBQVksQ0FBQywwQkFBMEI7QUFBQSxNQUN2QyxhQUFhO0FBQUEsTUFDYixpQkFBaUI7QUFBQSxNQUNqQixTQUFTO0FBQUEsUUFDUCxHQUFHLGVBQWU7QUFBQSxRQUNsQjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsTUFBTUMsZUFBYyxJQUFJLElBQUksTUFBTUYseUNBQWUsQ0FBQztBQUFBLE1BQ2xELGVBQWU7QUFBQSxRQUNiLEtBQUssQ0FBQyxXQUFXO0FBQUEsTUFDbkI7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNSLFNBQVM7QUFBQSxRQUNULFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxRQUNBLFlBQVk7QUFBQSxRQUNaLFVBQVU7QUFBQSxRQUNWLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLFFBQ2pDLGtCQUFrQjtBQUFBLE1BQ3BCO0FBQUEsTUFDQSxXQUFXLENBQUMsV0FBVyx1QkFBdUI7QUFBQSxNQUM5QyxZQUFZO0FBQUEsUUFDVix5QkFBeUI7QUFBQSxNQUMzQjtBQUFBLE1BQ0EsYUFBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGLENBQUM7QUFDSDsiLAogICJuYW1lcyI6IFsiZmlsZVVSTFRvUGF0aCIsICJkZWZpbmVDb25maWciLCAiVVJMIiwgIlVSTCIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsIiwgImRlZmluZUNvbmZpZyIsICJmaWxlVVJMVG9QYXRoIl0KfQo=
