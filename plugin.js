const express = require('express')
const AdminBro = require('admin-bro')

const router = express.Router()
const path = require('path')
const bodyParser = require('body-parser')
const SessionAuth = require('./extensions/session-auth')

module.exports = {
  name: 'AdminBroExpressjs',
  version: '0.1.0',

  /**
  * build the plugin
  * @param  {Object} options                         options passed to AdminBro
  * @param  {Object} options.auth
  * @param  {Object} [options.auth.authenticate]     function taking email and password
  *                                                  as an arguments. Should return logged in
  *                                                  user or null (no authorization). If given
  *                                                  options.auth.authMiddleware is set.
  * @param  {Object} [options.auth.authMiddleware]   auth middleware for expressjs routes
  *                                                  by default is set to none
  * @param  {Object} [options.auth.cookieName=adminBro] When auth strategy is set to session this
  *                                                     will be the name for the cookie.
  * @param  {Object} [options.auth.cookiePassword]   cookie password for session strategy*
  * @return {AdminBro}                               adminBro instance
  */
  buildExpressRouter: async (app, options) => {
    const { routes, assets } = AdminBro.Router
    const admin = new AdminBro(options)
    let authMiddleware = options.auth && options.auth.strategy

    router.use(bodyParser.json())
    router.use(bodyParser.urlencoded({ extended: true }))

    if (options.auth && options.auth.authenticate) {
      if (authMiddleware) {
        throw new Error(`When you gives auth.authenticate as a parameter - auth middleware is set to function that check if user is logged in.
                         Please remove auth.authMiddleware from authentication parameters.`)
      }

      authMiddleware = async (req, res, next) => {
        if (req.session.admin) {
          next()
        } else {
          res.redirect(admin.options.loginPath)
        }
      }

      await SessionAuth(app, {
        logoutPath: admin.options.logoutPath,
        loginPath: admin.options.loginPath,
        rootPath: admin.options.rootPath,
        cookieName: 'admin-bro',
        ...options.auth,
      }, AdminBro)
    }

    routes.forEach((route) => {
      // we have to change routes defined in admin bro from {recordId} to :recordId
      const expressPath = route.path.replace(/{/g, ':').replace(/}/g, '')
      const handler = async (req, res) => {
        try {
          const controller = new route.Controller({ admin })
          const { params, query } = req
          const payload = req.body
          const ret = await controller[route.action]({ params, query, payload }, res)
          res.send(ret)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e)
        }
      }

      const isAuthSession = options.auth && authMiddleware

      if (route.method === 'GET') {
        if (isAuthSession) {
          router.get(expressPath, authMiddleware, handler)
        } else {
          router.get(expressPath, handler)
        }
      }

      if (route.method === 'POST') {
        if (isAuthSession) {
          router.post(expressPath, authMiddleware, handler)
        } else {
          router.post(expressPath, handler)
        }
      }
    })

    assets.forEach((asset) => {
      router.get(asset.path, async (req, res) => {
        res.sendfile(path.resolve(asset.src))
      })
    })

    return router
  },
}
