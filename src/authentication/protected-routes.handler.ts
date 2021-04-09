import AdminBro, { Router as AdminRouter } from "admin-bro";
import { Router } from "express";
import { convertToExpressRoute } from "../convertRoutes";
import { pathToRegexp } from "path-to-regexp";

export const withProtectedRoutesHandler = (
  router: Router,
  admin: AdminBro
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
  let urlWithoutRoot = url;

  if (adminRootUrl?.length && adminRootUrl !== "/") {
    urlWithoutRoot = url.substring(adminRootUrl?.length ?? 0, url.length);
  }

  return (
    isAdminRootUrl ||
    adminRoutes.some((route) => pathToRegexp(route).test(urlWithoutRoot))
  );
};

const isAdminAsset = (url: string) =>
  AdminRouter.assets.find((asset) => url.match(asset.path));
