const AdminBro = require('admin-bro')

module.exports = {
  name: 'AdminBroExpressjs',
  version: '0.1.0',

  register: async (options) => {
    const express = require('express')
    const router = express.Router()
    const path = require('path');

    const { routes, assets } = AdminBro.Router
    const admin = new AdminBro(options)

    routes.forEach((route) => {
      if (route.method === "GET") {
        const expressPath = route.path.replace(/{/g, ':').replace(/}/g, '')
        console.log('expressPath: ', expressPath)
        router.get(expressPath, async (req, res, next) => {
          const controller = new route.Controller({ admin })
          const ret = await controller[route.action](req, res)
          res.send(ret)
        })
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