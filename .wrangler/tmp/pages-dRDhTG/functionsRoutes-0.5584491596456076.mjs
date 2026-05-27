import { onRequestGet as __api_images__id__js_onRequestGet } from "/Users/aqueous/Photography Portfolio/functions/api/images/[id].js"
import { onRequestPost as __api_login_js_onRequestPost } from "/Users/aqueous/Photography Portfolio/functions/api/login.js"
import { onRequestGet as __api_portfolio_js_onRequestGet } from "/Users/aqueous/Photography Portfolio/functions/api/portfolio.js"
import { onRequestPost as __api_portfolio_js_onRequestPost } from "/Users/aqueous/Photography Portfolio/functions/api/portfolio.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "/Users/aqueous/Photography Portfolio/functions/api/upload.js"

export const routes = [
    {
      routePath: "/api/images/:id",
      mountPath: "/api/images",
      method: "GET",
      middlewares: [],
      modules: [__api_images__id__js_onRequestGet],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_login_js_onRequestPost],
    },
  {
      routePath: "/api/portfolio",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_portfolio_js_onRequestGet],
    },
  {
      routePath: "/api/portfolio",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_portfolio_js_onRequestPost],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  ]