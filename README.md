# Expressjs plugin for AdminBro

This is an official [AdminBro](https://github.com/SoftwareBrothers/admin-bro) plugin which integrates it to [expressjs](https://expressjs.com/) framework.

## Usage

The plugin can be registered using standard `app.use` method.

```javascript
const AdminBroPlugin = require('admin-bro-expressjs')
const adminRootPath = '/admin'
const adminBroOptions = {
  databases: [...],
  branding: {
    companyName: 'Amazing c.o.',
  },
  adminRootPath,
  // ...and other options
}

const adminRouter = await AdminBroExress.register(app, adminBroOptions)
app.use(adminRootPath, adminRouter)
```

To see all standard admin-bro options - please visit: https://github.com/SoftwareBrothers/admin-bro project.

## Examples

In examples folder we prepared one working example:
* [simplest integration with mongodb database](examples/simple.js)

You can run one of them by typing:

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