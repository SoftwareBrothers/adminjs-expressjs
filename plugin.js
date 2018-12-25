const express = require('express')
const AdminBro = require('admin-bro')

const cookieParser = require('cookie-parser')
const session = require('express-session')

const path = require('path')
const bodyParser = require('body-parser')

const pkg = require('./package.json')

const Plugin = {
  name: 'AdminBroExpressjs',
  version: pkg.version,

  /**
   * Builds the express router handling all the pages and assets
   *
   * @param  {AdminBro} adminBro                    instance of adminBro
   * @param  {express.Router} [predefinedRouter]    expressjs router
   * @return {express.Router}                       expressjs router
  */
  buildRouter: (admin, predefinedRouter) => {
    const { routes, assets } = AdminBro.Router
    const router = predefinedRouter || express.Router()

    router.use(bodyParser.json())
    router.use(bodyParser.urlencoded({ extended: true }))

    routes.forEach((route) => {
      // we have to change routes defined in admin bro from {recordId} to :recordId
      const expressPath = route.path.replace(/{/g, ':').replace(/}/g, '')

      const handler = async (req, res) => {
        try {
          const controller = new route.Controller({ admin }, req.adminUser)
          const { params, query } = req
          const payload = req.body
          const html = await controller[route.action]({ params, query, payload }, res)
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
  },

  /**
   * Builds the express router which requires authentication
   *
   * @param  {AdminBro} adminBro                    instance of adminBro
   * @param  {Object} auth                          authenticatino options
   * @param  {Function} auth.authenticate           function taking 2 arguments: email
   *                                                and password. Returns authenticated
   *                                                user or null in case of wrong email
   *                                                and/or password
   * @param  {String} auth.cookiePassword           secret used to encrypt cookies
   * @param  {String} auth.cookieName=adminbro      cookie name
   * @param  {express.Router} [predefinedRouter]    expressjs router
   * @return {express.Router}                       expressjs router
  */
  buildAuthenticatedRouter(admin, auth, predefinedRouter) {
    if (!cookieParser || !session) {
      throw new Error(['In order to use authentication you have to install',
                       'cookie-parser and express-session packages'].join(' '))
    }
    const router = predefinedRouter || express.Router()
    router.use(cookieParser())
    router.use(session({
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

    return Plugin.buildRouter(admin, router)
  },
}

module.exports = Plugin
