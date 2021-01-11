export class WrongArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WrongArgumentError";
  }
}

export class OldBodyParserUsedError extends Error {
  constructor(
    message = `
  You probably used old \`body-parser\` middleware, which is not compatible
  with @admin-bro/express. In order to make it work you will have to
  1. move body-parser invocation after the admin bro setup like this:
  
  const adminBro = new AdminBro()
  const router = new buildRouter(adminBro)
  app.use(adminBro.options.rootPath, router)
  
  // body parser goes after the AdminBro router
  app.use(bodyParser())
  
  2. Upgrade body-parser to the latest version and use it like this:
  app.use(bodyParser.json())
  `
  ) {
    super(message);
    this.name = "WrongArgumentError";
  }
}
