const express = require('express')
const AdminBro = require('admin-bro')

const path = require('path')
const formidableMiddleware = require('express-formidable')

const pkg = require('./package.json')

let session

try {
  session = require('express-session') // eslint-disable-line global-require
} catch (e) {
  console.info('express-session was not required')
}

/**
 * Builds the Express Router that handles all the pages and assets
 *
 * @param  {AdminBro} admin                       instance of AdminBro
 * @param  {express.Router} [predefinedRouter]    Express.js router
 * @param  {ExpressFormidableOptions} [formidableOptions]    Express.js router
 * @return {express.Router}                       Express.js router
 * @function
 * @static
 * @memberof module:admin-bro-expressjs
 */
const buildRouter = (admin, predefinedRouter, formidableOptions) => {
  if (!admin || admin.constructor.name !== 'AdminBro') {
    const e = new Error('you have to pass an instance of AdminBro to the buildRouter() function')
    e.name = 'WrongArgumentError'
    throw e
  }

  admin.initialize().then(() => {
    console.log('AdminBro: bundle ready')
  })

  const { routes, assets } = AdminBro.Router
  const router = predefinedRouter || express.Router()

  router.use(formidableMiddleware(formidableOptions))

  routes.forEach((route) => {
    // we have to change routes defined in AdminBro from {recordId} to :recordId
    const expressPath = route.path.replace(/{/g, ':').replace(/}/g, '')
    /**
     * @type {express.Handler}
     */
    const handler = async (req, res, next) => {
      try {
        const controller = new route.Controller({ admin }, req.session && req.session.adminUser)
        const { params, query } = req
        const method = req.method.toLowerCase()
        const payload = {
          ...(req.fields || {}),
          ...(req.files || {}),
        }
        const html = await controller[route.action]({
          ...req,
          params,
          query,
          payload,
          method,
        }, res)
        if (route.contentType) {
          res.set({ 'Content-Type': route.contentType })
        }
        if (html) {
          res.send(html)
        }
      } catch (e) {
        next(e)
      }
    }

    if (route.method === 'GET') {
      router.get(expressPath, handler)
    }

    if (route.method === 'POST') {
      router.post(expressPath, handler)
    }
  })

  assets.forEach((asset) => {
    router.get(asset.path, async (req, res) => {
      res.sendFile(path.resolve(asset.src))
    })
  })

  return router
}

/**
 * @typedef {Function} Authenticate
 * @memberof module:admin-bro-expressjs
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
 * @param  {module:admin-bro-expressjs.Authenticate} auth.authenticate       authenticate function
 * @param  {String} auth.cookiePassword           secret used to encrypt cookies
 * @param  {String} auth.cookieName=adminbro      cookie name
 * @param  {express.Router} [predefinedRouter]    Express.js router
 * @param  {SessionOptions} [sessionOptions]     Options that are passed to [express-session](https://github.com/expressjs/session)
 * @param  {ExpressFormidableOptions} [formidableOptions]     Options that are passed to [express-session](https://github.com/expressjs/session)
 * @return {express.Router}                       Express.js router
 * @static
 * @memberof module:admin-bro-expressjs
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
 *   cookiePassword: 'somepassword',
 * }, [router])
 */
const buildAuthenticatedRouter = (
  admin,
  auth,
  predefinedRouter,
  sessionOptions = {},
  formidableOptions = {},
) => {
  if (!session) {
    throw new Error(['In order to use authentication, you have to install',
      ' express-session package',
    ].join(' '))
  }
  const router = predefinedRouter || express.Router()

  router.use((req, res, next) => {
    if (req._body) {
      next(new Error([
        'You probably used old `body-parser` middleware, which is not compatible',
        'with admin-bro-expressjs. In order to make it work you will have to',
        '1. move body-parser invocation after the admin bro setup like this:',

        'const adminBro = new AdminBro()',
        'const router = new buildRouter(adminBro)',
        'app.use(adminBro.options.rootPath, router)',

        '// body parser goes after the AdminBro router',
        'app.use(bodyParser())',

        '2. Upgrade body-parser to the latest version and use it like this:',
        'app.use(bodyParser.json())',
      ].join('\n')))
    }
    next()
  })

  router.use(session({
    ...sessionOptions,
    secret: auth.cookiePassword,
    name: auth.cookieName || 'adminbro',
  }))

  router.use(formidableMiddleware(formidableOptions))

  const { rootPath } = admin.options
  let { loginPath, logoutPath } = admin.options
  loginPath = loginPath.replace(rootPath, '')
  logoutPath = logoutPath.replace(rootPath, '')

  router.get(loginPath, async (req, res) => {
    const login = await admin.renderLogin({
      action: admin.options.loginPath,
      errorMessage: null,
    })
    res.send(login)
  })

  router.post(loginPath, async (req, res, next) => {
    const { email, password } = req.fields
    const adminUser = await auth.authenticate(email, password)
    if (adminUser) {
      req.session.adminUser = adminUser
      req.session.save((err) => {
        if (err) {
          next(err)
        }
        res.redirect(rootPath)
      })
    } else {
      const login = await admin.renderLogin({
        action: admin.options.loginPath,
        errorMessage: 'invalidCredentials',
      })
      res.send(login)
    }
  })

  router.use((req, res, next) => {
    if (AdminBro.Router.assets.find(asset => req.originalUrl.match(asset.path))) {
      next()
    } else if (req.session.adminUser) {
      next()
    } else {
      res.redirect(admin.options.loginPath)
    }
  })

  router.get(logoutPath, async (req, res) => {
    req.session.destroy(() => {
      res.redirect(admin.options.loginPath)
    })
  })

  return buildRouter(admin, router, formidableOptions)
}

module.exports = {
  buildRouter,
  buildAuthenticatedRouter,
  /**
   * Version of the plugin
   * @static
   * @memberof module:admin-bro-expressjs
   */
  version: pkg.version,
  /**
   * Plugin name
   * @static
   * @memberof module:admin-bro-expressjs
   */
  name: 'AdminBroExpressjs',
}
