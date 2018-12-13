const AdminBro = require('admin-bro')

module.exports = {
  name: 'AdminBroExpressjs',
  version: '0.1.0',

  register: async (app, options) => {
    const express = require('express')
    const router = express.Router()
    const path = require('path');
    const bodyParser = require('body-parser');

    const { routes, assets } = AdminBro.Router
    const admin = new AdminBro(options)

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    routes.forEach((route) => {
      const expressPath = route.path.replace(/{/g, ':').replace(/}/g, '')
      const handler = async (req, res, next) => {
        try {
          const controller = new route.Controller({ admin })
          const { params, query } = req
          const payload = req.body
          const ret = await controller[route.action]({ params, query, payload}, res)
          res.send(ret)
        } catch (e) {
          console.log(e);
        }
      }

      if (route.method === "GET") {
        router.get(expressPath, handler)
      }

      if (route.method === 'POST') {
        router.post(expressPath, handler)
      }
    })

    assets.forEach((asset) => {
      router.get(asset.path, async(req, res, next) => {
        res.sendfile(path.resolve(asset.src));
      })
    })

    return router
  },
}