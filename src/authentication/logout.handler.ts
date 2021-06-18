import AdminJS from "adminjs";
import { Router } from "express";

const getLogoutPath = (admin: AdminJS) => {
  const { logoutPath, rootPath } = admin.options;
  const normalizedLogoutPath = logoutPath.replace(rootPath, "");

  return normalizedLogoutPath.startsWith("/")
    ? normalizedLogoutPath
    : `/${normalizedLogoutPath}`;
};

export const withLogout = (router: Router, admin: AdminJS): void => {
  const logoutPath = getLogoutPath(admin);

  router.get(logoutPath, async (request, response) => {
    request.session.destroy(() => {
      response.redirect(admin.options.loginPath);
    });
  });
};
