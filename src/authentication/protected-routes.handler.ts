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

    if (isAdminRoute(req.originalUrl, rootPath)) {
      if (!!req.session.adminUser) {
        return next();
      }
      return res.redirect(loginPath);
    }

    return next(); // custom routes in admin router
  });
};

export const isAdminRoute = (
  originalUrl: string,
  adminRootPath: string
): boolean => {
  const adminRoutes = AdminRouter.routes
    .map((route) => convertToExpressRoute(route.path))
    .filter((route) => route !== "");

  let urlWithoutAdminRootPath = originalUrl.split("?")[0];
  if (adminRootPath !== "/") {
    urlWithoutAdminRootPath = urlWithoutAdminRootPath.replace(
      adminRootPath,
      ""
    );
    if (!urlWithoutAdminRootPath.startsWith("/")) {
      urlWithoutAdminRootPath = `/${urlWithoutAdminRootPath}`;
    }
  }

  const isAdminRootUrl = originalUrl === adminRootPath;
  const isUrlUnderRootPath = originalUrl.startsWith(adminRootPath);

  return (
    isAdminRootUrl ||
    (adminRoutes.some((route) =>
      pathToRegexp(route).test(urlWithoutAdminRootPath)
    ) &&
      isUrlUnderRootPath)
  );
};

const isAdminAsset = (url: string) =>
  AdminRouter.assets.find((asset) => url.match(asset.path));
