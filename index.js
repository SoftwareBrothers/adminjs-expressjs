/**
 * @module admin-bro-expressjs
 *
 * @description
 * Plugin which allows you to add AdminBro to expressjs applications.
 *
 * ## Installation
 *
 * ``````sh
 * npm install admin-bro-expressjs
 * ```
 * 
 * ## Usage
 *
 * ```
 * const AdminBroExpress = require('admin-bro-expressjs')
 * ```
 *
 * It exposes 2 methods which creates an Express Router which can be attached
 * to given url in the API. Each method takes an preconfigured instance of {@link AdminBro}.
 *
 * - {@link module:admin-bro-expressjs.buildRouter AdminBroExpress.buildRouter(admin, [predefinedRouter])}
 * - {@link module:admin-bro-expressjs.buildAuthenticatedRouter AdminBroExpress.buildAuthenticatedRouter(admin, auth, [predefinedRouter])}
 *
 * If you want to use a router you have already created - it is not a problem. Just pass it
 * as a `predefinedRouter` parameter.
 * 
 * You may want to use this option when you want to include
 * some custom auth middleware for you AdminBro routes.
 *
 * ## Example without an authentication
 *
 * ```
 * const AdminBro = require('admin-bro')
 * const AdminBroExpress = require('admin-bro-expressjs')
 *
 * const express = require('express')
 * const app = express()
 *
 * const adminBro = new AdminBro({
 *   databases: [],
 *   rootPath: '/admin',
 * })
 *
 * const router = AdminBroExpress.buildRouter(adminBro)
 * app.use(adminBro.options.rootPath, router)
 * app.listen(8080, () => console.log('AdminBro is under localhost:8080/admin'))
 * ```
 *
 * ## Using build in authentication
 *
 * To protect the routes with an session authentication you can use predefined
 * {@link module:admin-bro-expressjs.buildAuthenticatedRouter} method.
 *
 * ## Adding custom authentication
 *
 * Also you can add your custom authentication setup by first, creating the router, and then
 * passing it via the `predefinedRouter` option.
 *
 * ```
 * let router = express.Router()
 * router.use((req, res, next) => {
 *   if (req.session && req.session.admin) {
 *     req.adminUser = req.session.admin
 *     next()
 *   } else {
 *     res.redirect(adminBro.options.loginPath)
 *   }
 * })
 * router = AdminBroExpress.buildRouter(adminBro, router)
 * ```
 */

const Plugin = require('./plugin')

module.exports = Plugin
