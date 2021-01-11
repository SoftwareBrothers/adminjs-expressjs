import AdminBro from "admin-bro";
import { Router } from "express";

const getLogoutPath = (admin: AdminBro) => {
  const { logoutPath, rootPath } = admin.options;
  const normalizedLogoutPath = logoutPath.replace(rootPath, "");

  return normalizedLogoutPath.startsWith("/")
    ? normalizedLogoutPath
    : `/${normalizedLogoutPath}`;
};

export const withLogout = (router: Router, admin: AdminBro): void => {
  const logoutPath = getLogoutPath(admin);

  router.get(logoutPath, async (request, response) => {
    request.session.destroy(() => {
      response.redirect(admin.options.loginPath);
    });
  });
};
