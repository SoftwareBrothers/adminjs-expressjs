import AdminJS, { Router as AdminRouter } from "adminjs";
import { Router } from "express";
import { convertToExpressRoute } from "../convertRoutes";
import { pathToRegexp } from "path-to-regexp";

export const withProtectedRoutesHandler = (
  router: Router,
  admin: AdminJS
): void => {
  const { rootPath } = admin.options;

  router.use((req, res, next) => {
    if (isAdminAsset(req.originalUrl)) {
      next();
    } else if (
      req.session.adminUser ||
      // these routes doesn't need authentication
      req.originalUrl.startsWith(admin.options.loginPath) ||
      req.originalUrl.startsWith(admin.options.logoutPath)
    ) {
      next();
    } else if (isAdminRoute(req.originalUrl, rootPath)) {
      // If the redirection is caused by API call to some action just redirect to resource
      const [redirectTo] = req.originalUrl.split("/actions");
      req.session.redirectTo = redirectTo.includes(`${rootPath}/api`)
        ? rootPath
        : redirectTo;

      req.session.save((err) => {
        if (err) {
          next(err);
        }
        res.redirect(admin.options.loginPath);
      });
    } else {
      next();
    }
  });
};

export const isAdminRoute = (url: string, adminRootUrl: string): boolean => {
  const adminRoutes = AdminRouter.routes
    .map((route) => convertToExpressRoute(route.path))
    .filter((route) => route !== "");
  const isAdminRootUrl = url === adminRootUrl;

  return (
    isAdminRootUrl ||
    !!adminRoutes.find((route) => pathToRegexp(route).test(url))
  );
};

const isAdminAsset = (url: string) =>
  AdminRouter.assets.find((asset) => url.match(asset.path));
