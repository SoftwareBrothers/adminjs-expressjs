const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/mongo-examples'
const cookiePassword = process.env.ADMIN_COOKIE_SECRET || 'yoursupersecretcookiepassword-veryveryverylong'
const mongoose = require('mongoose');
const AdminBroExpress = require('../plugin')
const AdminBroMongose = require('admin-bro-mongoose')
const AdminBro = require('admin-bro')
const Admin = require('./mongoose/admin-model')
const Bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require("express-session")


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
  app.use(cookieParser());
  app.use(session({ secret: cookiePassword }));

  const checkSignIn = async (req, res, next) => {
    if(req.session.admin){
      next()
    } else {
      const login = await AdminBro.renderLogin({
        action: adminLoginPath,
        errorMessage: 'Invalid credentials!'
      })
      res.send(login)
      res.redirect(adminLoginPath)
    }
  }

  const adminRootPath = '/admin'
  const adminLoginPath = '/admin/login'
  const adminLogoutPath = '/admin/logout'
  const adminBroOptions = {
    databases: [connection],
    branding: {
      companyName: 'Amazing c.o.',
    },
    rootPath: adminRootPath,
    auth: checkSignIn
  }
  const adminRouter = await AdminBroExpress.register(app, adminBroOptions)

  app.get(adminLoginPath, async (req, res) => {
    const login = await AdminBro.renderLogin({action: adminLoginPath})
    res.send(login)
  })

  app.post(adminLoginPath, async(req, res) => {
    const { email, password } = req.body
    const admin = await Admin.findOne({ email })
    const isValid = admin && await Bcrypt.compare(password, admin.password)
    if (isValid) {
      req.session.admin = admin
      res.redirect(adminRootPath)
    } else {
      const login = await AdminBro.renderLogin({
        action: adminLoginPath,
        errorMessage: 'Invalid credentials!'
      })
      res.send(login)
    }
  })

  app.get(adminLogoutPath, async(req, res) => {
    req.session.destroy();
    res.redirect(adminLoginPath)
  })

  app.use(adminRootPath, adminRouter)

  app.listen(port, () => console.log(`Listening on port ${port}`))
}

start()