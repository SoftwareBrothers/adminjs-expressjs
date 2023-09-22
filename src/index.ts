/* eslint-disable max-len */
import { buildAuthenticatedRouter } from "./buildAuthenticatedRouter.js";
import { buildRouter } from "./buildRouter.js";

/**
 * @module @adminjs/express
 * @subcategory Plugins
 * @section modules
 *
 * @classdesc
 * Plugin that allows you to add AdminJS to Express.js applications.
 *
 * ## Installation
 *
 * ```sh
 * npm install @adminjs/express
 * ```
 *
 * It has 2 peerDependencies: `express-formidable` and `express`,
 * so you have to install them as well (if they are not installed already)
 *
 * ```
 * npm install express express-formidable
 * ```
 *
 * ## Usage
 *
 * ```
 * const AdminJSExpress = require('@adminjs/express')
 * ```
 *
 * It exposes 2 methods that create an Express Router, which can be attached
 * to a given url in the API. Each method takes a pre-configured instance of {@link AdminJS}.
 *
 * - {@link module:@adminjs/express.buildRouter AdminJSExpress.buildRouter(admin, [predefinedRouter])}
 * - {@link module:@adminjs/express.buildAuthenticatedRouter AdminJSExpress.buildAuthenticatedRouter(admin, auth, [predefinedRouter], sessionOptions)}
 *
 * If you want to use a router you have already created - not a problem. Just pass it
 * as a `predefinedRouter` parameter.
 *
 * You may want to use this option when you want to include
 * some custom auth middleware for you AdminJS routes.
 *
 * ## Example without an authentication
 *
 * ```
 * const AdminJS = require('adminjs')
 * const AdminJSExpress = require('@adminjs/express')
 *
 * const express = require('express')
 * const app = express()
 *
 * const adminJs = new AdminJS({
 *   databases: [],
 *   rootPath: '/admin',
 * })
 *
 * const router = AdminJSExpress.buildRouter(adminJs)
 * app.use(adminJs.options.rootPath, router)
 * app.listen(8080, () => console.log('AdminJS is running under localhost:8080/admin'))
 * ```
 *
 * ## Using build in authentication
 *
 * To protect the routes with a session authentication, you can use predefined
 * {@link module:@adminjs/express.buildAuthenticatedRouter} method.
 *
 * Note! To use authentication in production environment, there is a need to configure
 * express-session for production build. It can be achieved by passing options to
 * `sessionOptions` parameter. Read more on [express/session Github page](https://github.com/expressjs/session)
 *
 * ## Adding custom authentication
 *
 * You can add your custom authentication setup by firstly creating the router and then
 * passing it via the `predefinedRouter` option.
 *
 * ```
 * let router = express.Router()
 * router.use((req, res, next) => {
 *   if (req.session && req.session.admin) {
 *     req.session.adminUser = req.session.admin
 *     next()
 *   } else {
 *     res.redirect(adminJs.options.loginPath)
 *   }
 * })
 * router = AdminJSExpress.buildRouter(adminJs, router)
 * ```
 *
 * Where `req.session.admin` is {@link AdminJS#CurrentAdmin},
 * meaning that it should have at least an email property.
 */

/**
 * Plugin name
 * @static
 * @memberof module:@adminjs/express
 */
export const name = "AdminJSExpressjs";
export { SessionData } from "express-session";

export type ExpressPlugin = {
  name: string;
  buildAuthenticatedRouter: typeof buildAuthenticatedRouter;
  buildRouter: typeof buildRouter;
};

const plugin: ExpressPlugin = { name, buildAuthenticatedRouter, buildRouter };

export default plugin;

export type {
  AuthenticationOptions,
  FormidableOptions,
  AuthenticationMaxRetriesOptions,
  AuthenticationContext,
} from "./types.js";
export * from "./buildRouter.js";
export * from "./buildAuthenticatedRouter.js";
export * from "./convertRoutes.js";
export * from "./errors.js";
export * from "./logger.js";
export * from "./authentication/login.handler.js";
export * from "./authentication/logout.handler.js";
export * from "./authentication/protected-routes.handler.js";
