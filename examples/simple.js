const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const AdminBroExress = require('../plugin')
const AdminBroMongose = require('admin-bro-mongoose')
const AdminBro = require('admin-bro')
AdminBro.registerAdapter(AdminBroMongose)

require('./mongoose/article-model')
require('./mongoose/admin-model')

const start = async () => {
  const connection = await mongoose.connect('mongodb://localhost:27017/mongo-examples')

  const adminRootPath = '/admin'
  const adminBroOptions = {
    databases: [connection],
    branding: {
      companyName: 'Amazing c.o.',
    },
    adminRootPath,
  }
  const adminRouter = await AdminBroExress.register(adminBroOptions)
  app.use(adminRootPath, adminRouter)

  app.listen(port, () => console.log(`Listening on port ${port}`))
}

start()


