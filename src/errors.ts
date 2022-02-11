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
  with @adminjs/express. In order to make it work you will have to
  1. move body-parser invocation after the AdminJS setup like this:
  
  const adminJs = new AdminJS()
  const router = new buildRouter(adminJs)
  app.use(adminJs.options.rootPath, router)
  
  // body parser goes after the AdminJS router
  app.use(bodyParser())
  
  2. Upgrade body-parser to the latest version and use it like this:
  app.use(bodyParser.json())
  `
  ) {
    super(message);
    this.name = "WrongArgumentError";
  }
}
