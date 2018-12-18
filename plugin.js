const AdminBro = require('admin-bro')
const express = require('express')

const router = express.Router()
const path = require('path')
const bodyParser = require('body-parser')

module.exports = {
  name: 'AdminBroExpressjs',
  version: '0.1.0',

  /**
  * build the plugin
  * @param  {Object} options                         options passed to AdminBro
  * @return {AdminBro}                               adminBro instance
  */
  buildExpressRouter: async (options) => {
    const { routes, assets } = AdminBro.Router
    const admin = new AdminBro(options)

    router.use(bodyParser.json())
    router.use(bodyParser.urlencoded({ extended: true }))

    routes.forEach((route) => {
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

      if (route.method === 'GET') {
        router.get(expressPath, handler)
      }

      if (route.method === 'POST') {
        router.post(expressPath, handler)
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
