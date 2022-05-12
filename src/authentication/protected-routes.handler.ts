import AdminJS, { Router as AdminRouter } from "adminjs";
import { Router } from "express";
import { convertToExpressRoute } from "../convertRoutes";
import { pathToRegexp } from "path-to-regexp";

const doesNotRequireAuthentication = (
  url: string,
  { loginPath, logoutPath }
) => {
  return (
    isAdminAsset(url) || url.startsWith(loginPath) || url.startsWith(logoutPath)
  );
};

export const withProtectedRoutesHandler = (
  router: Router,
  admin: AdminJS
): void => {
  const { rootPath, loginPath, logoutPath } = admin.options;

  router.use((req, res, next) => {
    if (
      doesNotRequireAuthentication(req.originalUrl, { loginPath, logoutPath })
    ) {
      return next();
    }

    if (isAdminRoute(req.originalUrl, rootPath) && !!req.session.adminUser) {
      return next();
    }

    return res.redirect(loginPath);
  });
};

export const isAdminRoute = (url: string, adminRootPath: string): boolean => {
  const adminRoutes = AdminRouter.routes
    .map((route) => convertToExpressRoute(route.path))
    .filter((route) => route !== "");

  let urlWithoutAdminRootPath = url.split("?")[0];
  if (adminRootPath !== "/") {
    urlWithoutAdminRootPath = url.replace(adminRootPath, "");
    if (!urlWithoutAdminRootPath.startsWith("/")) {
      urlWithoutAdminRootPath = `/${urlWithoutAdminRootPath}`;
    }
  }

  const isAdminRootUrl = url === adminRootPath;

  return (
    isAdminRootUrl ||
    adminRoutes.some((route) =>
      pathToRegexp(route).test(urlWithoutAdminRootPath)
    )
  );
};

const isAdminAsset = (url: string) =>
  AdminRouter.assets.find((asset) => url.match(asset.path));
