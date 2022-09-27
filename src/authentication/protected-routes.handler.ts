import AdminJS from "adminjs";
import { Router, RequestHandler } from "express";

export const withProtectedRoutesHandler = (
  router: Router,
  admin: AdminJS
): void => {
  const { loginPath } = admin.options;
  const authorizedRoutesMiddleware: RequestHandler = (
    request,
    response,
    next
  ) => {
    if (!request.session || !request.session.adminUser) {
      return response.redirect(loginPath);
    }
    return next();
  };

  router.use(authorizedRoutesMiddleware);
};
