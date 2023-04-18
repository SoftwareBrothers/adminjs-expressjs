import AdminJS, { Router as AdminRouter } from "adminjs";
import { RequestHandler, Router } from "express";
import formidableMiddleware from "express-formidable";
import path from "path";

import { WrongArgumentError } from "./errors.js";
import { log } from "./logger.js";
import { FormidableOptions } from "./types.js";
import { convertToExpressRoute } from "./convertRoutes.js";

const INVALID_ADMINJS_INSTANCE =
  "You have to pass an instance of AdminJS to the buildRouter() function";

export type RouteHandlerArgs = {
  admin: AdminJS;
  route: (typeof AdminRouter)["routes"][0];
};

export type BuildRoutesArgs = {
  admin: AdminJS;
  routes: (typeof AdminRouter)["routes"];
  router: Router;
};

export type BuildAssetsArgs = {
  admin: AdminJS;
  assets: (typeof AdminRouter)["assets"];
  routes: (typeof AdminRouter)["routes"];
  router: Router;
};

export const initializeAdmin = (admin: AdminJS): void => {
  if (admin?.constructor?.name !== "AdminJS") {
    throw new WrongArgumentError(INVALID_ADMINJS_INSTANCE);
  }

  admin.initialize().then(() => {
    log.debug("AdminJS: bundle ready");
  });
};

export const routeHandler =
  ({ admin, route }: RouteHandlerArgs): RequestHandler =>
  async (req, res, next) => {
    try {
      const controller = new route.Controller(
        { admin },
        req.session && req.session.adminUser
      );
      const { params, query } = req;
      const method = req.method.toLowerCase();
      const payload = {
        ...(req.fields || {}),
        ...(req.files || {}),
      };
      const html = await controller[route.action](
        {
          ...req,
          params,
          query,
          payload,
          method,
        },
        res
      );
      if (route.contentType) {
        res.set({ "Content-Type": route.contentType });
      }
      if (html) {
        res.send(html);
      }
    } catch (e) {
      next(e);
    }
  };

export const buildRoute = ({
  route,
  router,
  admin,
}: {
  route: (typeof AdminRouter)["routes"][number];
  router: Router;
  admin: AdminJS;
}) => {
  // we have to change routes defined in AdminJS from {recordId} to :recordId
  const expressPath = convertToExpressRoute(route.path);

  if (route.method === "GET") {
    router.get(expressPath, routeHandler({ admin, route }));
  }

  if (route.method === "POST") {
    router.post(expressPath, routeHandler({ admin, route }));
  }
};

export const buildRoutes = ({
  admin,
  routes,
  router,
}: BuildRoutesArgs): void => {
  routes.forEach((route) => buildRoute({ route, router, admin }));
};

export const buildAssets = ({
  admin,
  assets,
  routes,
  router,
}: BuildAssetsArgs): void => {
  // Note: We want components.bundle.js to be globally available. In production it is served as a .js asset, meanwhile
  // in local environments it's a route with "bundleComponents" action assigned.
  const componentBundlerRoute = routes.find(
    (r) => r.action === "bundleComponents"
  );
  if (componentBundlerRoute) {
    buildRoute({ route: componentBundlerRoute, router, admin });
  }

  assets.forEach((asset) => {
    router.get(asset.path, async (_req, res) => {
      res.sendFile(path.resolve(asset.src));
    });
  });
};

export const buildRouter = (
  admin: AdminJS,
  predefinedRouter?: Router | null,
  formidableOptions?: FormidableOptions
): Router => {
  initializeAdmin(admin);

  const { routes, assets } = AdminRouter;
  const router = predefinedRouter ?? Router();
  // todo fix types
  router.use(formidableMiddleware(formidableOptions) as any);

  buildAssets({ admin, assets, routes, router });
  buildRoutes({ admin, routes, router });

  return router;
};
