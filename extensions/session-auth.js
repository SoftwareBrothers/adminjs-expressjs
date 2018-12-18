const cookieParser = require('cookie-parser')
const session = require('express-session')

/**
 * Creates authentication logic for admin users
 * @param  {Express} app  Expressjs server instance
 * @param  {Object} options Configiration options passed to admin bro
 * @param  {String} options.logoutPath
 * @param  {String} options.loginPath
 * @param  {String} options.cookiePassword
 * @param  {Function} options.authenticate
 * @param  {AdminBro} AdminBro
 */
const sessionAuth = async (app, options, AdminBro) => {
  const {
    logoutPath,
    loginPath,
    rootPath,
    cookiePassword,
    cookieName,
    authenticate,
  } = options

  app.use(cookieParser())
  app.use(session({
    secret: cookiePassword,
    name: cookieName,
  }))

  app.get(loginPath, async (req, res) => {
    const login = await AdminBro.renderLogin({ action: loginPath })
    res.send(login)
  })

  app.post(loginPath, async (req, res) => {
    const { email, password } = req.body
    const admin = await authenticate(email, password)
    if (admin) {
      req.session.admin = admin
      res.redirect(rootPath)
    } else {
      const login = await AdminBro.renderLogin({
        action: loginPath,
        errorMessage: 'Invalid credentials!',
      })
      res.send(login)
    }
  })

  app.get(logoutPath, async (req, res) => {
    req.session.destroy()
    res.redirect(loginPath)
  })
}

module.exports = sessionAuth
