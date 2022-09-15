import session from 'express-session'

export type AuthenticationOptions = {
  authenticate: (email, password) => any
  session?: session.SessionOptions
  cookiePassword: string
  cookieName?: string
}

class AuthService {
  options: AuthenticationOptions

  constructor(options: AuthenticationOptions) {
    this.options = options
  }

  async authenticate(payload, _internals): Promise<any> {
    const { email, password } = payload
    return this.options.authenticate(email, password)
  }
}

export default AuthService
