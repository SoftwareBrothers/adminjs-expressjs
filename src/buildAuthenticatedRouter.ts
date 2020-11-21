import AdminBro, { Router as AdminRouter } from "admin-bro";
import express, { Router } from "express";
import formidableMiddleware from "express-formidable";
import session from "express-session";
import { buildRouter } from "./buildRouter";
import { OldBodyParserUsedError } from "./errors";
import { FormidableOptions } from "./types";

/**
 * @typedef {Function} Authenticate
 * @memberof module:@admin-bro/express
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
 *
 * @param  {AdminBro} admin                    instance of AdminBro
 * @param  {Object} auth                          authentication options
 * @param  {module:@admin-bro/express.Authenticate} auth.authenticate       authenticate function
 * @param  {String} auth.cookiePassword           secret used to encrypt cookies
 * @param  {String} auth.cookieName=adminbro      cookie name
 * @param  {express.Router} [predefinedRouter]    Express.js router
 * @param  {SessionOptions} [sessionOptions]     Options that are passed to [express-session](https://github.com/expressjs/session)
 * @param  {ExpressFormidableOptions} [formidableOptions]     Options that are passed to [express-session](https://github.com/expressjs/session)
 * @return {express.Router}                       Express.js router
 * @static
 * @memberof module:@admin-bro/express
 * @example
 * const ADMIN = {
 *   email: 'test@example.com',
 *   password: 'password',
 * }
 *
 * AdminBroExpress.buildAuthenticatedRouter(adminBro, {
 *   authenticate: async (email, password) => {
 *     if (ADMIN.password === password && ADMIN.email === email) {
 *       return ADMIN
 *     }
 *     return null
 *   },
 *   cookieName: 'adminbro',
 *   cookiePassword: 'somePassword',
 * }, [router])
 */
export const buildAuthenticatedRouter = (
  admin: AdminBro,
  auth: {
    cookiePassword: string;
    cookieName?: string;
    authenticate: (email: string, password: string) => unknown | null;
  },
  predefinedRouter: express.Router,
  sessionOptions: session.SessionOptions,
  formidableOptions: FormidableOptions
): Router => {
  const router = predefinedRouter || express.Router();

  router.use((req, _, next) => {
    if (req._body) {
      next(new OldBodyParserUsedError());
    }
    next();
  });

  router.use(
    session({
      ...sessionOptions,
      secret: auth.cookiePassword,
      name: auth.cookieName || "adminbro",
    })
  );

  router.use(formidableMiddleware(formidableOptions));

  const { rootPath } = admin.options;
  let { loginPath, logoutPath } = admin.options;
  // since we are inside already namespaced router we have to replace login and logout routes that
  // they don't have rootUrl inside. So changing /admin/login to just /login.
  // but there is a case where user gives / as a root url and /login becomes `login`. We have to
  // fix it by adding / in front of the route
  loginPath = loginPath.replace(rootPath, "");
  if (!loginPath.startsWith("/")) {
    loginPath = `/${loginPath}`;
  }

  logoutPath = logoutPath.replace(rootPath, "");
  if (!logoutPath.startsWith("/")) {
    logoutPath = `/${logoutPath}`;
  }

  router.get(loginPath, async (req, res) => {
    const login = await admin.renderLogin({
      action: admin.options.loginPath,
      errorMessage: null,
    });
    res.send(login);
  });

  router.post(loginPath, async (req, res, next) => {
    const { email, password } = req.fields as {
      email: string;
      password: string;
    };
    const adminUser = await auth.authenticate(email, password);
    if (adminUser) {
      req.session.adminUser = adminUser;
      req.session.save((err) => {
        if (err) {
          next(err);
        }
        if (req.session.redirectTo) {
          res.redirect(req.session.redirectTo);
        } else {
          res.redirect(rootPath);
        }
      });
    } else {
      const login = await admin.renderLogin({
        action: admin.options.loginPath,
        errorMessage: "invalidCredentials",
      });
      res.send(login);
    }
  });

  router.use((req, res, next) => {
    if (AdminRouter.assets.find((asset) => req.originalUrl.match(asset.path))) {
      next();
    } else if (
      req.session.adminUser ||
      // these routes doesn't need authentication
      req.originalUrl.startsWith(admin.options.loginPath) ||
      req.originalUrl.startsWith(admin.options.logoutPath)
    ) {
      next();
    } else {
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
    }
  });

  router.get(logoutPath, async (req, res) => {
    req.session.destroy(() => {
      res.redirect(admin.options.loginPath);
    });
  });

  return buildRouter(admin, router, formidableOptions);
};
