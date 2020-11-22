import AdminBro from "admin-bro";
import { RequestHandler } from "express-serve-static-core";

export const createLogoutHandler = (admin: AdminBro): RequestHandler => async (
  request,
  response
) => {
  request.session.destroy(() => {
    response.redirect(admin.options.loginPath);
  });
};
