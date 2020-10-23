export type Authenticate = Function;
/**
 * Builds the Express Router that handles all the pages and assets
 *
 * @param  {AdminBro} admin                       instance of AdminBro
 * @param  {express.Router} [predefinedRouter]    Express.js router
 * @param  {ExpressFormidableOptions} [formidableOptions]    Express.js router
 * @return {express.Router}                       Express.js router
 * @function
 * @static
 * @memberof module:@admin-bro/express
 */
export function buildRouter(admin: typeof import("admin-bro"), predefinedRouter?: import("express").Router, formidableOptions?: any): import("express").Router;
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
export function buildAuthenticatedRouter(admin: typeof import("admin-bro"), auth: {
    authenticate: any;
    cookiePassword: string;
    cookieName: string;
}, predefinedRouter?: import("express").Router, sessionOptions?: any, formidableOptions?: any): import("express").Router;
export declare const version: any;
export declare const name: string;
