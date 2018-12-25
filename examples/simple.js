const AdminBro = require('admin-bro')
const express = require('express')
const mongoose = require('mongoose')

AdminBro.registerAdapter(require('admin-bro-mongoose'))

const AdminBroExpress = require('../index')

// load the database models
require('./mongoose/article-model')
require('./mongoose/admin-model')


const start = async () => {
  const connection = await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/example')
  const app = express()

  const adminBro = new AdminBro({
    databases: [connection],
    rootPath: '/admin',
  })
  const router = AdminBroExpress.buildRouter(adminBro)

  app.use(adminBro.options.rootPath, router)

  app.listen(process.env.PORT || 8080, () => console.log('AdminBro is under localhost:8080/admin'))
}

start()
