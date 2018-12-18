const express = require('express')

const app = express()
const port = process.env.PORT || 3000
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/mongo-examples'
const mongoose = require('mongoose')
const AdminBro = require('admin-bro')
const AdminBroMongose = require('admin-bro-mongoose')
const AdminBroExpress = require('../plugin')

AdminBro.registerAdapter(AdminBroMongose)

require('./mongoose/article-model')
require('./mongoose/admin-model')

const start = async () => {
  const connection = await mongoose.connect(mongoUrl)

  const adminRootPath = '/admin'
  const adminBroOptions = {
    databases: [connection],
    branding: {
      companyName: 'Amazing c.o.',
    },
    adminRootPath,
  }
  const adminRouter = await AdminBroExpress.buildExpressRouter(adminBroOptions)

  app.use(adminRootPath, adminRouter)

  // eslint-disable-next-line no-console
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

start()
