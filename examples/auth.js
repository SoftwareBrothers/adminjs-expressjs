const express = require('express')

const app = express()
const port = process.env.PORT || 3000
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/mongo-examples'
const cookiePassword = process.env.ADMIN_COOKIE_SECRET || 'yoursupersecretcookiepassword-veryveryverylong'
const mongoose = require('mongoose')
const Bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const AdminBro = require('admin-bro')
const AdminBroMongose = require('admin-bro-mongoose')
const AdminBroExpress = require('../plugin')
const Admin = require('./mongoose/admin-model')


AdminBro.registerAdapter(AdminBroMongose)

const createAdminIfNone = async () => {
  const existingAdmin = await Admin.countDocuments() > 0
  if (!existingAdmin) {
    const password = await Bcrypt.hash('password', 10)
    const admin = new Admin({ email: 'test@example.com', password })
    await admin.save()
  }
}

const start = async () => {
  const connection = await mongoose.connect(mongoUrl)

  await createAdminIfNone()

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use(session({ secret: cookiePassword }))

  const adminRootPath = '/admin'
  const adminBroOptions = {
    databases: [connection],
    branding: {
      companyName: 'Amazing c.o.',
    },
    rootPath: adminRootPath,
    auth: {
      authenticate: async (email, password) => {
        const admin = await Admin.findOne({ email })
        const isValid = admin && await Bcrypt.compare(password, admin.password)
        return isValid && admin
      },
      cookiePassword,
    },
  }
  const adminRouter = await AdminBroExpress.buildExpressRouter(app, adminBroOptions)

  app.use(adminRootPath, adminRouter)

  // eslint-disable-next-line no-console
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

start()
