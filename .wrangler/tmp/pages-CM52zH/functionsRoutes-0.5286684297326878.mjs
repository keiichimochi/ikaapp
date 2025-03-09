import { onRequest as __api_line_webhook_ts_onRequest } from "/Volumes/mac 1/github/ikaapp/functions/api/line-webhook.ts"
import { onRequest as __claude_proxy_js_onRequest } from "/Volumes/mac 1/github/ikaapp/functions/claude-proxy.js"
import { onRequest as __line_bot_index_ts_onRequest } from "/Volumes/mac 1/github/ikaapp/functions/line-bot/index.ts"

export const routes = [
    {
      routePath: "/api/line-webhook",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_line_webhook_ts_onRequest],
    },
  {
      routePath: "/claude-proxy",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__claude_proxy_js_onRequest],
    },
  {
      routePath: "/line-bot",
      mountPath: "/line-bot",
      method: "",
      middlewares: [],
      modules: [__line_bot_index_ts_onRequest],
    },
  ]