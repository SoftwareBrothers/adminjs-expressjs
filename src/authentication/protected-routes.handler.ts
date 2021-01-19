import AdminBro, { Router as AdminRouter } from "admin-bro";
import { Router } from "express";

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

const isAdminRoute = (url: string, adminRootUrl: string) => {
  const adminRoutes = AdminRouter.routes.filter((route) => route.path !== "");
  const isAdminRootUrl = url === adminRootUrl;

  return isAdminRootUrl || adminRoutes.find((route) => route.path === url);
};

const isAdminAsset = (url: string) =>
  AdminRouter.assets.find((asset) => url.match(asset.path));
