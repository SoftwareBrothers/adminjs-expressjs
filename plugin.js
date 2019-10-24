const express = require('express')
const AdminBro = require('admin-bro')

const path = require('path')
const bodyParser = require('body-parser')

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
 * @return {express.Router}                       Express.js router
 * @function
 * @static
 * @memberof module:admin-bro-expressjs
*/
const buildRouter = (admin, predefinedRouter) => {
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

  router.use(bodyParser.json())
  router.use(bodyParser.urlencoded({ extended: true }))

  routes.forEach((route) => {
    // we have to change routes defined in AdminBro from {recordId} to :recordId
    const expressPath = route.path.replace(/{/g, ':').replace(/}/g, '')

    const handler = async (req, res) => {
      try {
        const controller = new route.Controller({ admin }, req.session && req.session.adminUser)
        const { params, query } = req
        const method = req.method.toLowerCase()
        const payload = req.body
        const html = await controller[route.action]({
          ...req, params, query, payload, method,
        }, res)
        if (route.contentType) {
          res.set({ 'Content-Type': route.contentType })
        }
        if (html) {
          res.send(html)
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
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
 * Builds the Express Router which is protected by a session auth
 *
 * Using the router requires you to install `express-session` as a
 * dependency.
 *
 * @param  {AdminBro} admin                    instance of AdminBro
 * @param  {Object} auth                          authentication options
 * @param  {Function} auth.authenticate           function takes 2 arguments: email
 *                                                and password. Returns authenticated
 *                                                user or null, in case of a wrong email
 *                                                and/or password
 * @param  {String} auth.cookiePassword           secret used to encrypt cookies
 * @param  {String} auth.cookieName=adminbro      cookie name
 * @param  {express.Router} [predefinedRouter]    Express.js router
 * @param  {session.options} [sessionOptions]     Options that are passed to express-session
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
const buildAuthenticatedRouter = (admin, auth, predefinedRouter, sessionOptions = {}) => {
  if (!session) {
    throw new Error(['In order to use authentication, you have to install',
      ' express-session package'].join(' '))
  }
  const router = predefinedRouter || express.Router()
  router.use(session({
    ...sessionOptions,
    secret: auth.cookiePassword,
    name: auth.cookieName || 'adminbro',
  }))
  router.use(bodyParser.json())
  router.use(bodyParser.urlencoded({ extended: true }))

  const { rootPath } = admin.options
  let { loginPath, logoutPath } = admin.options
  loginPath = loginPath.replace(rootPath, '')
  logoutPath = logoutPath.replace(rootPath, '')

  router.get(loginPath, async (req, res) => {
    const login = await AdminBro.renderLogin({ action: admin.options.loginPath })
    res.send(login)
  })

  router.post(loginPath, async (req, res) => {
    const { email, password } = req.body
    const adminUser = await auth.authenticate(email, password)
    if (adminUser) {
      req.session.adminUser = adminUser
      res.redirect(rootPath)
    } else {
      const login = await AdminBro.renderLogin({
        action: admin.options.loginPath,
        errorMessage: 'Invalid credentials!',
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
    req.session.destroy()
    res.redirect(admin.options.loginPath)
  })

  return buildRouter(admin, router)
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
