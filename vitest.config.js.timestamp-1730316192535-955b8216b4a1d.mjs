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
        }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyIsICJ2aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wZXRlcnNvbi5zaWx2YS9EZXNrdG9wL1JlcG9zL2F6aW9uLWNvbnNvbGUta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGV0ZXJzb24uc2lsdmEvRGVza3RvcC9SZXBvcy9hemlvbi1jb25zb2xlLWtpdC92aXRlc3QuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9wZXRlcnNvbi5zaWx2YS9EZXNrdG9wL1JlcG9zL2F6aW9uLWNvbnNvbGUta2l0L3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBtZXJnZUNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGNvbmZpZ0RlZmF1bHRzIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gJy4vdml0ZS5jb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIHNldHVwRmlsZXM6IFsnc3JjL3Rlc3RzL3NldHVwLXRlc3RzLmpzJ10sXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICAgIHBhc3NXaXRoTm9UZXN0czogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgLi4uY29uZmlnRGVmYXVsdHMuZXhjbHVkZSxcbiAgICAgICAgJ2UyZS8qJyxcbiAgICAgICAgJ2N5cHJlc3MnLFxuICAgICAgICAnYXppb24nLFxuICAgICAgICAnLnZzY29kZScsXG4gICAgICAgICcuaHVza3knLFxuICAgICAgICAnLnZpdGUnLFxuICAgICAgICAnLmdpdGh1YicsXG4gICAgICAgICdkb2NzJyxcbiAgICAgICAgJ3B1YmxpYydcbiAgICAgIF0sXG4gICAgICByb290OiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICB0cmFuc2Zvcm1Nb2RlOiB7XG4gICAgICAgIHdlYjogWy9cXC5banRdc3gkL11cbiAgICAgIH0sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBpbmNsdWRlOiBbXG4gICAgICAgICAgJ3NyYy9zZXJ2aWNlcy8qKicsXG4gICAgICAgICAgJ3NyYy92aWV3cy8qKicsXG4gICAgICAgICAgJ3NyYy9oZWxwZXJzLyoqJyxcbiAgICAgICAgICAnc3JjL3BsdWdpbnMvKionLFxuICAgICAgICAgICdzcmMvbW9kdWxlcy8qKidcbiAgICAgICAgXSxcbiAgICAgICAgc3RhdGVtZW50czogOTEsXG4gICAgICAgIGJyYW5jaGVzOiA5MSxcbiAgICAgICAgZnVuY3Rpb25zOiA5MSxcbiAgICAgICAgbGluZXM6IDkxLFxuICAgICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2xjb3YnLCAnaHRtbCddLFxuICAgICAgICByZXBvcnRzRGlyZWN0b3J5OiAnLi9jb3ZlcmFnZS91bml0JyxcbiAgICAgIH0sXG4gICAgICByZXBvcnRlcnM6IFsnZGVmYXVsdCcsICd2aXRlc3Qtc29uYXItcmVwb3J0ZXInXSxcbiAgICAgIG91dHB1dEZpbGU6IHtcbiAgICAgICAgJ3ZpdGVzdC1zb25hci1yZXBvcnRlcic6ICcuL2NvdmVyYWdlL3VuaXQvc29uYXItcmVwb3J0LnhtbCdcbiAgICAgIH0sXG4gICAgICB0ZXN0VGltZW91dDogMzAwMDBcbiAgICB9XG4gIH0pXG4pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wZXRlcnNvbi5zaWx2YS9EZXNrdG9wL1JlcG9zL2F6aW9uLWNvbnNvbGUta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGV0ZXJzb24uc2lsdmEvRGVza3RvcC9SZXBvcy9hemlvbi1jb25zb2xlLWtpdC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGV0ZXJzb24uc2lsdmEvRGVza3RvcC9SZXBvcy9hemlvbi1jb25zb2xlLWtpdC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAncHJvY2VzcydcblxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IGlzdGFuYnVsIGZyb20gJ3ZpdGUtcGx1Z2luLWlzdGFuYnVsJ1xuXG5jb25zdCBnZXRDb25maWcgPSAoKSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYoJ2RldmVsb3BtZW50JywgcHJvY2Vzcy5jd2QoKSlcbiAgY29uc3QgVVJMU3RhcnRQcmVmaXggPSBlbnYuVklURV9FTlZJUk9OTUVOVCA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2h0dHBzOi8vJyA6ICdodHRwczovL3N0YWdlLSdcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtcbiAgICAgIHZ1ZSgpLFxuICAgICAgdnVlSnN4KCksXG4gICAgICBpc3RhbmJ1bCh7XG4gICAgICAgIG55Y3JjUGF0aDogJy5ueWNyYydcbiAgICAgIH0pXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBleHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJywgJy5tdHMnLCAnLnRzJywgJy5qc3gnLCAnLnRzeCcsICcuanNvbicsICcudnVlJ10sXG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0B0ZW1wbGF0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3RlbXBsYXRlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHZpZXdzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy92aWV3cycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHNlcnZpY2VzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9zZXJ2aWNlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQHN0b3Jlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc3RvcmVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAYXNzZXRzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9hc3NldHMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Byb3V0ZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3JvdXRlci9yb3V0ZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Btb2R1bGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9tb2R1bGVzJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcHJveHk6IHtcbiAgICAgICAgJ14vYXBpLyhtYXJrZXRwbGFjZXxzY3JpcHQtcnVubmVyfHRlbXBsYXRlLWVuZ2luZXxpYW0pJzoge1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9bWFuYWdlci5hemlvbi5jb20vYCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+XG4gICAgICAgICAgICBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC8obWFya2V0cGxhY2V8c2NyaXB0LXJ1bm5lcnx0ZW1wbGF0ZS1lbmdpbmV8aWFtKS8sICcvJDEvYXBpJylcbiAgICAgICAgfSxcbiAgICAgICAgJ14vYXBpL3Zjcyc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXZjcy1hcGkuYXppb24ubmV0L2AsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC92Y3MvLCAnL3Zjcy9hcGknKVxuICAgICAgICB9LFxuICAgICAgICAnL2dyYXBocWwvY2l0aWVzJzoge1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9Y2l0aWVzLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvY2l0aWVzLywgJy9ncmFwaHFsJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9ncmFwaHFsL2JpbGxpbmcnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYW5hZ2VyLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvYmlsbGluZy8sICcvYmlsbGluZy9ncmFwaHFsJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9hcGkvd2ViaG9vay9jb25zb2xlX2ZlZWRiYWNrJzoge1xuICAgICAgICAgIHRhcmdldDogYGh0dHBzOi8vYXV0b21hdGUuYXppb24ubmV0L2AsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgfSxcbiAgICAgICAgJ14vYXBpLyhhY2NvdW50fHVzZXJ8dG9rZW58c3dpdGNoLWFjY291bnR8YXV0aHxwYXNzd29yZHx0b3RwKXxeL2xvZ291dCc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXNzby5hemlvbi5jb21gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBjb29raWVEb21haW5SZXdyaXRlOiB7ICcqJzogJycgfVxuICAgICAgICB9LFxuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWFwaS5hemlvbi5jb21gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH0sXG4gICAgICAgICcvd2VicGFnZXRlc3QnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgaHR0cHM6Ly93d3cuYXppb24uY29tL2FwaS93ZWJwYWdldGVzdGAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC93ZWJwYWdldGVzdC8sICcnKVxuICAgICAgICB9LFxuICAgICAgICAnL3dlYnBhZ2V0ZXN0LWV4dGVybmFsJzoge1xuICAgICAgICAgIHRhcmdldDogYGh0dHBzOi8vd3d3LmF6aW9uLmNvbS9hcGkvd2VicGFnZXRlc3RgLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvd2VicGFnZXRlc3QtZXh0ZXJuYWwvLCAnJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxu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QUM5QztBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsVUFDZCxRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsa0JBQWtCLEVBQUU7QUFBQSxRQUN0RDtBQUFBLFFBQ0EseUJBQXlCO0FBQUEsVUFDdkIsUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLDJCQUEyQixFQUFFO0FBQUEsUUFDL0Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYSxVQUFVLENBQUM7OztBRHRGNkssSUFBTUMsNENBQTJDO0FBS3JRLElBQU8sd0JBQVE7QUFBQSxFQUNiO0FBQUEsRUFDQUMsY0FBYTtBQUFBLElBQ1gsTUFBTTtBQUFBLE1BQ0osWUFBWSxDQUFDLDBCQUEwQjtBQUFBLE1BQ3ZDLGFBQWE7QUFBQSxNQUNiLGlCQUFpQjtBQUFBLE1BQ2pCLFNBQVM7QUFBQSxRQUNQLEdBQUcsZUFBZTtBQUFBLFFBQ2xCO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxNQUFNQyxlQUFjLElBQUksSUFBSSxNQUFNRix5Q0FBZSxDQUFDO0FBQUEsTUFDbEQsZUFBZTtBQUFBLFFBQ2IsS0FBSyxDQUFDLFdBQVc7QUFBQSxNQUNuQjtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1IsU0FBUztBQUFBLFFBQ1QsU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLFFBQ0EsWUFBWTtBQUFBLFFBQ1osVUFBVTtBQUFBLFFBQ1YsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsUUFDakMsa0JBQWtCO0FBQUEsTUFDcEI7QUFBQSxNQUNBLFdBQVcsQ0FBQyxXQUFXLHVCQUF1QjtBQUFBLE1BQzlDLFlBQVk7QUFBQSxRQUNWLHlCQUF5QjtBQUFBLE1BQzNCO0FBQUEsTUFDQSxhQUFhO0FBQUEsSUFDZjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJmaWxlVVJMVG9QYXRoIiwgImRlZmluZUNvbmZpZyIsICJVUkwiLCAiVVJMIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwiLCAiZGVmaW5lQ29uZmlnIiwgImZpbGVVUkxUb1BhdGgiXQp9Cg==
