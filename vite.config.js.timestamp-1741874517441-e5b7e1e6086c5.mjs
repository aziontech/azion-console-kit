// vite.config.js
import { fileURLToPath, URL } from "node:url";
import process from "process";
import vue from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { defineConfig, loadEnv } from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/vite/dist/node/index.js";
import istanbul from "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/node_modules/vite-plugin-istanbul/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/paulo.ferreira/Documents/Azion/azion-platform-kit/vite.config.js";
var getConfig = () => {
  const env = loadEnv("development", process.cwd());
  const URLStartPrefix = env.VITE_ENVIRONMENT === "production" ? "https://" : "https://stage-";
  const DomainSuffix = env.VITE_ENVIRONMENT === "production" ? "com" : "net";
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
        "@modules": fileURLToPath(new URL("./src/modules", __vite_injected_original_import_meta_url))
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
          target: `${URLStartPrefix}cities.azion.${DomainSuffix}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, "/graphql")
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
        "/v4": {
          target: `${URLStartPrefix}api.azion.com`,
          changeOrigin: true
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcGF1bG8uZmVycmVpcmEvRG9jdW1lbnRzL0F6aW9uL2F6aW9uLXBsYXRmb3JtLWtpdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3BhdWxvLmZlcnJlaXJhL0RvY3VtZW50cy9Bemlvbi9hemlvbi1wbGF0Zm9ybS1raXQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3BhdWxvLmZlcnJlaXJhL0RvY3VtZW50cy9Bemlvbi9hemlvbi1wbGF0Zm9ybS1raXQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnXG5cbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcbmltcG9ydCBpc3RhbmJ1bCBmcm9tICd2aXRlLXBsdWdpbi1pc3RhbmJ1bCdcblxuY29uc3QgZ2V0Q29uZmlnID0gKCkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KCdkZXZlbG9wbWVudCcsIHByb2Nlc3MuY3dkKCkpXG4gIGNvbnN0IFVSTFN0YXJ0UHJlZml4ID0gZW52LlZJVEVfRU5WSVJPTk1FTlQgPT09ICdwcm9kdWN0aW9uJyA/ICdodHRwczovLycgOiAnaHR0cHM6Ly9zdGFnZS0nXG4gIGNvbnN0IERvbWFpblN1ZmZpeCA9IGVudi5WSVRFX0VOVklST05NRU5UID09PSAncHJvZHVjdGlvbicgPyAnY29tJyA6ICduZXQnXG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICB2dWUoKSxcbiAgICAgIHZ1ZUpzeCgpLFxuICAgICAgaXN0YW5idWwoe1xuICAgICAgICBueWNyY1BhdGg6ICcubnljcmMnXG4gICAgICB9KVxuICAgIF0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgZXh0ZW5zaW9uczogWycubWpzJywgJy5qcycsICcubXRzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nLCAnLnZ1ZSddLFxuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAdGVtcGxhdGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy90ZW1wbGF0ZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0B2aWV3cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvdmlld3MnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BzZXJ2aWNlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvc2VydmljZXMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BzdG9yZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3N0b3JlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQGFzc2V0cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvYXNzZXRzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAcm91dGVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9yb3V0ZXIvcm91dGVzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAbW9kdWxlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvbW9kdWxlcycsIGltcG9ydC5tZXRhLnVybCkpXG4gICAgICB9XG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICdeL2FwaS8obWFya2V0cGxhY2V8c2NyaXB0LXJ1bm5lcnx0ZW1wbGF0ZS1lbmdpbmV8aWFtKSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fW1hbmFnZXIuYXppb24uY29tL2AsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PlxuICAgICAgICAgICAgcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvKG1hcmtldHBsYWNlfHNjcmlwdC1ydW5uZXJ8dGVtcGxhdGUtZW5naW5lfGlhbSkvLCAnLyQxL2FwaScpXG4gICAgICAgIH0sXG4gICAgICAgICdeL2FwaS92Y3MnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH12Y3MtYXBpLmF6aW9uLm5ldC9gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvdmNzLywgJy92Y3MvYXBpJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9ncmFwaHFsL2NpdGllcyc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWNpdGllcy5hemlvbi4ke0RvbWFpblN1ZmZpeH1gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvZ3JhcGhxbFxcL2NpdGllcy8sICcvZ3JhcGhxbCcpXG4gICAgICAgIH0sXG4gICAgICAgICcvYXBpL3dlYmhvb2svY29uc29sZV9mZWVkYmFjayc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGBodHRwczovL2F1dG9tYXRlLmF6aW9uLm5ldC9gLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXG4gICAgICAgIH0sXG4gICAgICAgICdeL2FwaS8oYWNjb3VudHx1c2VyfHRva2VufHN3aXRjaC1hY2NvdW50fGF1dGh8cGFzc3dvcmR8dG90cCl8Xi9sb2dvdXQnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1zc28uYXppb24uY29tYCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgY29va2llRG9tYWluUmV3cml0ZTogeyAnKic6ICcnIH1cbiAgICAgICAgfSxcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1hcGkuYXppb24uY29tYCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKVxuICAgICAgICB9LFxuICAgICAgICAnL3Y0Jzoge1xuICAgICAgICAgIHRhcmdldDogYCR7VVJMU3RhcnRQcmVmaXh9YXBpLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgICcvd2VicGFnZXRlc3QnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgaHR0cHM6Ly93d3cuYXppb24uY29tL2FwaS93ZWJwYWdldGVzdGAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC93ZWJwYWdldGVzdC8sICcnKVxuICAgICAgICB9LFxuICAgICAgICAnL3dlYnBhZ2V0ZXN0LWV4dGVybmFsJzoge1xuICAgICAgICAgIHRhcmdldDogYGh0dHBzOi8vd3d3LmF6aW9uLmNvbS9hcGkvd2VicGFnZXRlc3RgLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvd2VicGFnZXRlc3QtZXh0ZXJuYWwvLCAnJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9haSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGAke1VSTFN0YXJ0UHJlZml4fWFpLmF6aW9uLmNvbS9jb3BpbG90L2NoYXQvY29tcGxldGlvbnNgLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYWkvLCAnJylcbiAgICAgICAgfSxcbiAgICAgICAgJy9ncmFwaHFsL2FjY291bnRpbmcnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgJHtVUkxTdGFydFByZWZpeH1tYW5hZ2VyLmF6aW9uLmNvbWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9ncmFwaHFsXFwvYWNjb3VudGluZy8sICcvYWNjb3VudGluZy9ncmFwaHFsJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoZ2V0Q29uZmlnKCkpXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBWLFNBQVMsZUFBZSxXQUFXO0FBQzdYLE9BQU8sYUFBYTtBQUVwQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sY0FBYztBQU5tTSxJQUFNLDJDQUEyQztBQVF6USxJQUFNLFlBQVksTUFBTTtBQUN0QixRQUFNLE1BQU0sUUFBUSxlQUFlLFFBQVEsSUFBSSxDQUFDO0FBQ2hELFFBQU0saUJBQWlCLElBQUkscUJBQXFCLGVBQWUsYUFBYTtBQUM1RSxRQUFNLGVBQWUsSUFBSSxxQkFBcUIsZUFBZSxRQUFRO0FBRXJFLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLElBQUk7QUFBQSxNQUNKLE9B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
