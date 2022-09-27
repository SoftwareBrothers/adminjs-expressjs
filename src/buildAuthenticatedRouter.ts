import AdminJS, { Router as AdminRouter } from "adminjs";
import express, { Router } from "express";
import formidableMiddleware from "express-formidable";
import session from "express-session";
import { withLogin } from "./authentication/login.handler";
import { withLogout } from "./authentication/logout.handler";
import { withProtectedRoutesHandler } from "./authentication/protected-routes.handler";
import { buildAssets, buildRoutes, initializeAdmin } from "./buildRouter";
import { OldBodyParserUsedError } from "./errors";
import { AuthenticationOptions, FormidableOptions } from "./types";

/**
 * @typedef {Function} Authenticate
 * @memberof module:@adminjs/express
 * @description
 * function taking 2 arguments email and password
 * @param {string} [email]         email given in the form
 * @param {string} [password]      password given in the form
 * @return {CurrentAdmin | null}      returns current admin or null
 */

/**
 * Builds the Express Router which is protected by a session auth
 *
 * Using the router requires you to install `express-session` as a
 * dependency. Normally express-session holds session in memory, which is
 * not optimized for production usage and, in development, it causes
 * logging out after every page refresh (if you use nodemon).
 * @static
 * @memberof module:@adminjs/express
 * @example
 * const ADMIN = {
 *   email: 'test@example.com',
 *   password: 'password',
 * }
 *
 * AdminJSExpress.buildAuthenticatedRouter(adminJs, {
 *   authenticate: async (email, password) => {
 *     if (ADMIN.password === password && ADMIN.email === email) {
 *       return ADMIN
 *     }
 *     return null
 *   },
 *   cookieName: 'adminjs',
 *   cookiePassword: 'somePassword',
 * }, [router])
 */
export const buildAuthenticatedRouter = (
  admin: AdminJS,
  auth: AuthenticationOptions,
  predefinedRouter?: express.Router | null,
  sessionOptions?: session.SessionOptions,
  formidableOptions?: FormidableOptions
): Router => {
  initializeAdmin(admin);

  const { routes, assets } = AdminRouter;
  const router = predefinedRouter || express.Router();

  router.use((req, _, next) => {
    if ((req as any)._body) {
      next(new OldBodyParserUsedError());
    }
    next();
  });

  router.use(
    session({
      ...sessionOptions,
      secret: auth.cookiePassword,
      name: auth.cookieName || "adminjs",
    })
  );
  router.use(formidableMiddleware(formidableOptions));

  withLogin(router, admin, auth);
  withLogout(router, admin);
  buildAssets({ assets, router });

  withProtectedRoutesHandler(router, admin);
  buildRoutes({ admin, routes, router });

  return router;
};
