import AdminJS from "adminjs";
import { Router } from "express";
import { AuthenticationOptions } from "../types.js";

const getLogoutPath = (admin: AdminJS) => {
  const { logoutPath, rootPath } = admin.options;
  const normalizedLogoutPath = logoutPath.replace(rootPath, "");

  return normalizedLogoutPath.startsWith("/")
    ? normalizedLogoutPath
    : `/${normalizedLogoutPath}`;
};

export const withLogout = (
  router: Router,
  admin: AdminJS,
  auth: AuthenticationOptions
): void => {
  const logoutPath = getLogoutPath(admin);

  const { provider } = auth;

  router.get(logoutPath, async (request, response) => {
    if (provider) {
      await provider.handleLogout({ req: request, res: response });
    }

    request.session.destroy(() => {
      response.redirect(admin.options.loginPath);
    });
  });
};
