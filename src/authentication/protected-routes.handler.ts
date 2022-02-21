import AdminJS, { Router as AdminRouter } from "adminjs";
import { Router } from "express";
import { convertToExpressRoute } from "../convertRoutes";
import { pathToRegexp } from "path-to-regexp";

export const withProtectedRoutesHandler = (
  router: Router,
  admin: AdminJS
): void => {
  const { rootPath, loginPath, logoutPath } = admin.options;

  router.use((req, res, next) => {
    if (isAdminAsset(req.originalUrl)) {
      next();
    } else if (
      req.session.adminUser ||
      // these routes doesn't need authentication
      req.originalUrl.startsWith(loginPath) ||
      req.originalUrl.startsWith(logoutPath)
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
        res.redirect(loginPath);
      });
    } else {
      next();
    }
  });
};

export const isAdminRoute = (url: string, adminRootPath: string): boolean => {
  const adminRoutes = AdminRouter.routes
    .map((route) => convertToExpressRoute(route.path))
    .filter((route) => route !== "");

  let urlWithoutAdminRootPath = url;
  if (adminRootPath !== "/") {
    urlWithoutAdminRootPath = url.replace(adminRootPath, "");
    if (!urlWithoutAdminRootPath.startsWith("/")) {
      urlWithoutAdminRootPath = `/${urlWithoutAdminRootPath}`;
    }
  }

  const isAdminRootUrl = url === adminRootPath;

  return (
    isAdminRootUrl ||
    !!adminRoutes.find((route) =>
      pathToRegexp(route).test(urlWithoutAdminRootPath)
    )
  );
};

const isAdminAsset = (url: string) =>
  AdminRouter.assets.find((asset) => url.match(asset.path));
