import session from 'express-session'
import AdminJS, { BasePlugin, Router as AdminRouter, AdminRoute } from 'adminjs'
import merge from 'lodash/merge'
import { Router, RequestHandler } from 'express'
import formidableMiddleware from 'express-formidable'

import { FormidableOptions } from './types'
import { convertToExpressPath, normalizeAdminPath } from './helpers'
import AuthService from './tmp/auth-service'

export interface PluginOptions {
  predefinedRouter?: Router
  formidableOptions?: FormidableOptions
  authentication?: {
    required: boolean
    authService?: AuthService
  }
}

export interface RegisterReturnType {
  router: Router
}

const defaultOptions: PluginOptions = {
  formidableOptions: {},
  authentication: {
    required: false,
  },
}

export class Plugin extends BasePlugin<PluginOptions> {
  private router: Router

  constructor(admin: AdminJS, options: PluginOptions = {}) {
    super(admin, options)

    this.options = merge({}, defaultOptions, options)
    this.router = options.predefinedRouter ?? Router()
  }

  public register(): RegisterReturnType {
    this.buildRoutes()

    return { router: this.router }
  }

  public protectRoutes(): void {
    const middleware: RequestHandler = (request, response, next) => {
      if (!request.session || !request.session.adminUser) {
        return response.status(403).send('Unauthorized')
      }
      return next()
    }

    this.router.use(middleware)
  }

  public buildLoginRoute(normalizedLoginPath: string, authService: AuthService): void {
    this.router.use(
      session({
        ...this.options?.authentication?.authService?.options.session,
        secret: this.options?.authentication?.authService?.options.cookiePassword ?? 'secret',
        name: this.options?.authentication?.authService?.options.cookieName ?? 'adminjs',
      })
    )
    this.router.post(normalizedLoginPath, async (request, response, next) => {
      const { fields = {}, body = {} } = request
      const payload = { ...fields, ...body }

      const userData = await authService.authenticate(payload, {
        request,
        response,
        next,
        router: this.router,
        admin: this.admin,
      })

      if (!userData) {
        return response.status(401).send('Authentication error (#login)')
      }

      request.session.adminUser = userData
      request.session.save((err) => {
        if (err) {
          next(err)
        }
        return response.status(200).send(userData)
      })
    })
  }

  public buildLogoutRoute(normalizedLogoutPath: string): void {
    this.router.get(normalizedLogoutPath, async (request, response, next) => {
      let ok = false
      request.session.destroy((err) => {
        if (!err) {
          ok = true
        } else {
          next(err)
        }
      })

      if (!ok) {
        return response.status(401).send({ ok })
      }

      return response.status(200).send({ ok })
    })
  }

  public buildAuthenticationRoutes(): void {
    if (!this.options.authentication?.required) return

    const { authService } = this.options.authentication ?? {}
    if (!authService) {
      throw new Error('You must provide authentication service instance ("authService")!')
    }

    const { loginPath, logoutPath } = this.admin.options.paths
    const normalizedLoginPath = normalizeAdminPath(this.admin, loginPath)
    const normalizedLogoutPath = normalizeAdminPath(this.admin, logoutPath)

    this.buildLoginRoute(normalizedLoginPath, authService)
    this.buildLogoutRoute(normalizedLogoutPath)
    this.protectRoutes()
  }

  public buildRoutes(): void {
    const { routes } = AdminRouter

    this.router.use(formidableMiddleware(this.options.formidableOptions ?? {}))

    this.buildAuthenticationRoutes()

    routes.forEach((route) => {
      const expressPath = convertToExpressPath(route.path)
      const handler = this.getRouteHandler(route)

      if (route.method === 'GET') {
        this.router.get(expressPath, handler)
      }

      if (route.method === 'POST') {
        this.router.post(expressPath, handler)
      }
    })
  }

  private getRouteHandler(route: AdminRoute) {
    const handler: RequestHandler = async (request, response, next) => {
      try {
        const { Controller } = route
        const controller = new Controller({ admin: this.admin }, request.session && request.session.adminUser)
        const { params, query } = request
        const method = request.method.toLowerCase()
        const payload = {
          ...(request.fields || {}),
          ...(request.files || {}),
        }
        const html = await controller[route.action](
          {
            ...request,
            params,
            query,
            payload,
            method,
          },
          response
        )
        if (route.contentType) {
          response.set({ 'Content-Type': route.contentType })
        }
        if (html) {
          response.send(html)
        }
      } catch (e) {
        next(e)
      }
    }

    return handler
  }
}
