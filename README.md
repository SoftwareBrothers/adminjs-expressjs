# Expressjs plugin for AdminBro

This is an official [AdminBro](https://github.com/SoftwareBrothers/admin-bro) plugin which integrates it to [expressjs](https://expressjs.com/) framework.

## AdminBro

AdminBro is an automatic admin interface which can be plugged into your application. You, as a developer, provide database models (like posts, comments, stores, products or whatever else your application uses), and AdminBro generates UI which allows you (or other trusted users) to manage content.

Check out the example application with mongo and postgres models here: https://admin-bro-example-app.herokuapp.com/admin

Or visit [AdminBro](https://github.com/SoftwareBrothers/admin-bro) github page.

## Usage

AdminBroExpress exposes 2 functions 

1. `buildRouter(adminBro, [router])`. 
2. `buildAuthenticatedRouter(adminBro, auth, [router])`

### No authentication

`buildRouter` takes `AdminBro` instance and converts it into [an expressjs router](http://expressjs.com/en/4x/api.html#express.router). 

When you pass additional `router` parameter - instead of creating brand new router - it will use the one you provided. That is how you can define any middleware you like before routes definition.

```javascript
const AdminBro = require('admin-bro')
const AdminBroExpress = require('admin-bro-expressjs')
const express = require('express')

const adminBro = new AdminBro({
  databases: [],
  rootPath: '/admin',
})

const app = express()

// Here magic happens -> we build expressjs router based on AdminBro instance
const router = AdminBroExpress.buildRouter(adminBro)

app.use(adminBro.options.rootPath, router)

app.listen(8080, () => console.log('AdminBro is under localhost:8080/admin'))
```

The example above will launch the admin panel under default `localhost:8080/admin` url. Routes will be accessible by all users without any authentication.

## Build-in Authentication

`buildAuthenticatedRouter` on the other hand returns router which is protected by session auth. As before first argument is an instance of AdminBro class. Than comes authentication parameters:

* `authenticate(email, password)` - function which takes email and password and returns either authenticated user or null
* `cookiePassword` - secret used to encrypt cookies
* `cookieName` - cookie name

```
const ADMIN = {
  email: 'test@example.com',
  password: 'password',
}

AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  authenticate: async (email, password) => {
    if (ADMIN.password === password && ADMIN.email === email) {
      return ADMIN
    }
    return null
  },
  cookieName: 'adminbro',
  cookiePassword: 'somepassword',
}, [router])
```

### Custom authentication

Since you have expressjs router - you can apply any authentication you like by using expressjs middleware.

```
let router = express.Router()
router.use((req, res, next) => {
  if (req.session && req.session.admin) {
    req.adminUser = req.session.admin
    next()
  } else {
    res.redirect(adminBro.options.loginPath)
  }
})
router = AdminBroExpress.buildRouter(adminBro)
```

When you build your custom authentication please take into account the following:

* AdminBro routes checks if there is an `adminUser` object stored in `req`. When it is there and it has an email - AdminBro will render user box in the top right corner of every page.
* AdminBro has `adminBro.options.logoutPath` and `adminBro.options.loginPath` set to '/admin/logout' and '/admin/login' by default. So you should implement those routes. You can change those defaults as you like.
* AdminBro has special method: `AdminBro.renderLogin({ action, message})` which returns html for login page.


## Examples

In examples folder we prepared one working example:

* [simplest integration with mongodb database](examples/simple.js)
* [simplest integration with Build-in authentication](examples/auth.js)

You can run one of them by typing:
(assume you have mongodb running on port `27017`)

```bash
PORT=3000 MONGO_URL=mongodb://localhost:27017/yourserver node examples/simple.js
```

and then visit `http://localhost:3000/admin`


## License

AdminBro is Copyright © 2018 SoftwareBrothers.co. It is free software and may be redistributed under the terms specified in the [LICENSE](LICENSE) file.

## About SoftwareBrothers.co

<img src="https://softwarebrothers.co/assets/images/software-brothers-logo-full.svg" width=240>


We’re an open, friendly team that helps clients from all over the world to transform their businesses and create astonishing products.

* We are available to [hire](https://softwarebrothers.co/contact).
* If you want to work for us - check out the [career page](https://softwarebrothers.co/career).