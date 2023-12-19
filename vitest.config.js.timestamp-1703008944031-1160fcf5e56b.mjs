// vitest.config.js
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { mergeConfig, defineConfig as defineConfig2 } from "file:///Users/aloisio.bastian/Documents/azion/azion-platform-kit/node_modules/vite/dist/node/index.js";
import { configDefaults } from "file:///Users/aloisio.bastian/Documents/azion/azion-platform-kit/node_modules/vitest/dist/config.js";

// vite.config.js
import process from "process";
import { fileURLToPath, URL as URL2 } from "node:url";
import { defineConfig, loadEnv } from "file:///Users/aloisio.bastian/Documents/azion/azion-platform-kit/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/aloisio.bastian/Documents/azion/azion-platform-kit/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/aloisio.bastian/Documents/azion/azion-platform-kit/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/aloisio.bastian/Documents/azion/azion-platform-kit/vite.config.js";
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
        "@routes": fileURLToPath(new URL2("./src/router/routes", __vite_injected_original_import_meta_url))
      }
    },
    server: {
      proxy: {
        "^/api/(marketplace|script-runner|template-engine)": {
          target: `${URLStartPrefix}manager.azion.com/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/(marketplace|script-runner|template-engine)/, "/$1/api")
        },
        "/graphql/cities": {
          target: `${URLStartPrefix}cities.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, "/graphql")
        },
        "^/api/(account|user|token|switch-account|password|totp)|^/logout": {
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
var __vite_injected_original_import_meta_url2 = "file:///Users/aloisio.bastian/Documents/azion/azion-platform-kit/vitest.config.js";
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
        include: ["src/services/**", "src/views/**", "src/helpers/**"],
        statements: 81,
        branches: 90,
        functions: 81,
        lines: 81,
        reporter: ["text", "lcov"]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyIsICJ2aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9hbG9pc2lvLmJhc3RpYW4vRG9jdW1lbnRzL2F6aW9uL2F6aW9uLXBsYXRmb3JtLWtpdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2Fsb2lzaW8uYmFzdGlhbi9Eb2N1bWVudHMvYXppb24vYXppb24tcGxhdGZvcm0ta2l0L3ZpdGVzdC5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2Fsb2lzaW8uYmFzdGlhbi9Eb2N1bWVudHMvYXppb24vYXppb24tcGxhdGZvcm0ta2l0L3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBtZXJnZUNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGNvbmZpZ0RlZmF1bHRzIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gJy4vdml0ZS5jb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgICAgcGFzc1dpdGhOb1Rlc3RzOiB0cnVlLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAuLi5jb25maWdEZWZhdWx0cy5leGNsdWRlLFxuICAgICAgICAnZTJlLyonLFxuICAgICAgICAnY3lwcmVzcycsXG4gICAgICAgICdhemlvbicsXG4gICAgICAgICcudnNjb2RlJyxcbiAgICAgICAgJy5odXNreScsXG4gICAgICAgICcudml0ZScsXG4gICAgICAgICcuZ2l0aHViJyxcbiAgICAgICAgJ2RvY3MnLFxuICAgICAgICAncHVibGljJ1xuICAgICAgXSxcbiAgICAgIHJvb3Q6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi8nLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgIHRyYW5zZm9ybU1vZGU6IHtcbiAgICAgICAgd2ViOiBbL1xcLltqdF1zeCQvXVxuICAgICAgfSxcbiAgICAgIGNvdmVyYWdlOiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGluY2x1ZGU6IFsnc3JjL3NlcnZpY2VzLyoqJywgJ3NyYy92aWV3cy8qKicsICdzcmMvaGVscGVycy8qKiddLFxuICAgICAgICBzdGF0ZW1lbnRzOiA4MSxcbiAgICAgICAgYnJhbmNoZXM6IDkwLFxuICAgICAgICBmdW5jdGlvbnM6IDgxLFxuICAgICAgICBsaW5lczogODEsXG4gICAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnbGNvdiddXG4gICAgICB9LFxuICAgICAgcmVwb3J0ZXJzOiBbJ2RlZmF1bHQnLCAndml0ZXN0LXNvbmFyLXJlcG9ydGVyJ10sXG4gICAgICBvdXRwdXRGaWxlOiB7XG4gICAgICAgICd2aXRlc3Qtc29uYXItcmVwb3J0ZXInOiAnLi9jb3ZlcmFnZS9zb25hci1yZXBvcnQueG1sJ1xuICAgICAgfSxcbiAgICAgIHRlc3RUaW1lb3V0OiAzMDAwMFxuICAgIH1cbiAgfSlcbilcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2Fsb2lzaW8uYmFzdGlhbi9Eb2N1bWVudHMvYXppb24vYXppb24tcGxhdGZvcm0ta2l0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYWxvaXNpby5iYXN0aWFuL0RvY3VtZW50cy9hemlvbi9hemlvbi1wbGF0Zm9ybS1raXQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2Fsb2lzaW8uYmFzdGlhbi9Eb2N1bWVudHMvYXppb24vYXppb24tcGxhdGZvcm0ta2l0L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHByb2Nlc3MgZnJvbSAncHJvY2VzcydcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xuXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5cbmNvbnN0IGdldENvbmZpZyA9ICgpID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudignZGV2ZWxvcG1lbnQnLCBwcm9jZXNzLmN3ZCgpKVxuICBjb25zdCBVUkxTdGFydFByZWZpeCA9IGVudi5WSVRFX0VOVklST05NRU5UID09PSAnUFJPRFVDVElPTicgPyAnaHR0cHM6Ly8nIDogJ2h0dHBzOi8vc3RhZ2UtJ1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3Z1ZSgpLCB2dWVKc3goKV0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgZXh0ZW5zaW9uczogWycubWpzJywgJy5qcycsICcubXRzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nLCAnLnZ1ZSddLFxuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAdGVtcGxhdGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy90ZW1wbGF0ZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0B2aWV3cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvdmlld3MnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BzZXJ2aWNlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc2VydmljZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BzdG9yZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3N0b3JlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQGFzc2V0cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvYXNzZXRzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAcm91dGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9yb3V0ZXIvcm91dGVzJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcHJveHk6IHtcbiAgICAgICAgJ14vYXBpLyhtYXJrZXRwbGFjZXxzY3JpcHQtcnVubmVyfHRlbXBsYXRlLWVuZ2luZSknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYW5hZ2VyLmF6aW9uLmNvbS9gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT5cbiAgICAgICAgICAgIHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcLyhtYXJrZXRwbGFjZXxzY3JpcHQtcnVubmVyfHRlbXBsYXRlLWVuZ2luZSkvLCAnLyQxL2FwaScpXG4gICAgICAgIH0sXG4gICAgICAgICcvZ3JhcGhxbC9jaXRpZXMnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1jaXRpZXMuYXppb24uY29tYCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2dyYXBocWxcXC9jaXRpZXMvLCAnL2dyYXBocWwnKVxuICAgICAgICB9LFxuICAgICAgICAnXi9hcGkvKGFjY291bnR8dXNlcnx0b2tlbnxzd2l0Y2gtYWNjb3VudHxwYXNzd29yZHx0b3RwKXxeL2xvZ291dCc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fXNzby5hemlvbi5jb21gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBjb29raWVEb21haW5SZXdyaXRlOiB7ICcqJzogJycgfVxuICAgICAgICB9LFxuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWFwaS5hemlvbi5jb21gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGdldENvbmZpZygpKVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVyxTQUFTLGlCQUFBQSxzQkFBcUI7QUFDL1gsU0FBUyxhQUFhLGdCQUFBQyxxQkFBb0I7QUFDMUMsU0FBUyxzQkFBc0I7OztBQ0Y4VCxPQUFPLGFBQWE7QUFDalgsU0FBUyxlQUFlLE9BQUFDLFlBQVc7QUFFbkMsU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUx1TSxJQUFNLDJDQUEyQztBQU8zUSxJQUFNLFlBQVksTUFBTTtBQUN0QixRQUFNLE1BQU0sUUFBUSxlQUFlLFFBQVEsSUFBSSxDQUFDO0FBQ2hELFFBQU0saUJBQWlCLElBQUkscUJBQXFCLGVBQWUsYUFBYTtBQUU1RSxTQUFPO0FBQUEsSUFDTCxTQUFTLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUFBLElBQ3pCLFNBQVM7QUFBQSxNQUNQLFlBQVksQ0FBQyxRQUFRLE9BQU8sUUFBUSxPQUFPLFFBQVEsUUFBUSxTQUFTLE1BQU07QUFBQSxNQUMxRSxPQUFPO0FBQUEsUUFDTCxLQUFLLGNBQWMsSUFBSUMsS0FBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxRQUNwRCxjQUFjLGNBQWMsSUFBSUEsS0FBSSxtQkFBbUIsd0NBQWUsQ0FBQztBQUFBLFFBQ3ZFLFVBQVUsY0FBYyxJQUFJQSxLQUFJLGVBQWUsd0NBQWUsQ0FBQztBQUFBLFFBQy9ELGFBQWEsY0FBYyxJQUFJQSxLQUFJLGtCQUFrQix3Q0FBZSxDQUFDO0FBQUEsUUFDckUsV0FBVyxjQUFjLElBQUlBLEtBQUksZ0JBQWdCLHdDQUFlLENBQUM7QUFBQSxRQUNqRSxXQUFXLGNBQWMsSUFBSUEsS0FBSSxnQkFBZ0Isd0NBQWUsQ0FBQztBQUFBLFFBQ2pFLFdBQVcsY0FBYyxJQUFJQSxLQUFJLHVCQUF1Qix3Q0FBZSxDQUFDO0FBQUEsTUFDMUU7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCxxREFBcUQ7QUFBQSxVQUNuRCxRQUFRLEdBQUcsY0FBYztBQUFBLFVBQ3pCLGNBQWM7QUFBQSxVQUNkLFNBQVMsQ0FBQyxTQUNSLEtBQUssUUFBUSx1REFBdUQsU0FBUztBQUFBLFFBQ2pGO0FBQUEsUUFDQSxtQkFBbUI7QUFBQSxVQUNqQixRQUFRLEdBQUcsY0FBYztBQUFBLFVBQ3pCLGNBQWM7QUFBQSxVQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxzQkFBc0IsVUFBVTtBQUFBLFFBQ2xFO0FBQUEsUUFDQSxvRUFBb0U7QUFBQSxVQUNsRSxRQUFRLEdBQUcsY0FBYztBQUFBLFVBQ3pCLGNBQWM7QUFBQSxVQUNkLHFCQUFxQixFQUFFLEtBQUssR0FBRztBQUFBLFFBQ2pDO0FBQUEsUUFDQSxRQUFRO0FBQUEsVUFDTixRQUFRLEdBQUcsY0FBYztBQUFBLFVBQ3pCLGNBQWM7QUFBQSxVQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxRQUM5QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhLFVBQVUsQ0FBQzs7O0FEckRxTCxJQUFNQyw0Q0FBMkM7QUFLN1EsSUFBTyx3QkFBUTtBQUFBLEVBQ2I7QUFBQSxFQUNBQyxjQUFhO0FBQUEsSUFDWCxNQUFNO0FBQUEsTUFDSixhQUFhO0FBQUEsTUFDYixpQkFBaUI7QUFBQSxNQUNqQixTQUFTO0FBQUEsUUFDUCxHQUFHLGVBQWU7QUFBQSxRQUNsQjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsTUFBTUMsZUFBYyxJQUFJLElBQUksTUFBTUYseUNBQWUsQ0FBQztBQUFBLE1BQ2xELGVBQWU7QUFBQSxRQUNiLEtBQUssQ0FBQyxXQUFXO0FBQUEsTUFDbkI7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNSLFNBQVM7QUFBQSxRQUNULFNBQVMsQ0FBQyxtQkFBbUIsZ0JBQWdCLGdCQUFnQjtBQUFBLFFBQzdELFlBQVk7QUFBQSxRQUNaLFVBQVU7QUFBQSxRQUNWLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLFVBQVUsQ0FBQyxRQUFRLE1BQU07QUFBQSxNQUMzQjtBQUFBLE1BQ0EsV0FBVyxDQUFDLFdBQVcsdUJBQXVCO0FBQUEsTUFDOUMsWUFBWTtBQUFBLFFBQ1YseUJBQXlCO0FBQUEsTUFDM0I7QUFBQSxNQUNBLGFBQWE7QUFBQSxJQUNmO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbImZpbGVVUkxUb1BhdGgiLCAiZGVmaW5lQ29uZmlnIiwgIlVSTCIsICJVUkwiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCIsICJkZWZpbmVDb25maWciLCAiZmlsZVVSTFRvUGF0aCJdCn0K
