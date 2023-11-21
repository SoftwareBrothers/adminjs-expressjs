import AdminJS from "adminjs";
import { Router } from "express";

import type {
  AuthenticationContext,
  AuthenticationMaxRetriesOptions,
  AuthenticationOptions,
} from "../types.js";

const getLoginPath = (admin: AdminJS): string => {
  const { loginPath, rootPath } = admin.options;
  // since we are inside already namespaced router we have to replace login and logout routes that
  // they don't have rootUrl inside. So changing /admin/login to just /login.
  // but there is a case where user gives / as a root url and /login becomes `login`. We have to
  // fix it by adding / in front of the route
  const normalizedLoginPath = loginPath.replace(rootPath, "");

  return normalizedLoginPath.startsWith("/")
    ? normalizedLoginPath
    : `/${normalizedLoginPath}`;
};

class Retry {
  private static retriesContainer: Map<string, Retry> = new Map();
  private lastRetry: Date | undefined;
  private retriesCount = 0;

  constructor(ip: string) {
    const existing = Retry.retriesContainer.get(ip);
    if (existing) {
      return existing;
    }
    Retry.retriesContainer.set(ip, this);
  }

  public canLogin(
    maxRetries: number | AuthenticationMaxRetriesOptions | undefined
  ): boolean {
    if (maxRetries === undefined) {
      return true;
    } else if (typeof maxRetries === "number") {
      maxRetries = {
        count: maxRetries,
        duration: 60,
      };
    } else if (maxRetries.count <= 0) {
      return true;
    }
    if (
      !this.lastRetry ||
      new Date().getTime() - this.lastRetry.getTime() >
        maxRetries.duration * 1000
    ) {
      this.lastRetry = new Date();
      this.retriesCount = 1;
      return true;
    } else {
      this.lastRetry = new Date();
      this.retriesCount++;
      return this.retriesCount <= maxRetries.count;
    }
  }
}

export const withLogin = (
  router: Router,
  admin: AdminJS,
  auth: AuthenticationOptions
): void => {
  const { rootPath } = admin.options;
  const loginPath = getLoginPath(admin);

  const { provider } = auth;
  const providerProps = provider?.getUiProps?.() ?? {};

  router.get(loginPath, async (req, res) => {
    const baseProps = {
      action: admin.options.loginPath,
      errorMessage: null,
    };
    const login = await admin.renderLogin({
      ...baseProps,
      ...providerProps,
    });

    return res.send(login);
  });

  router.post(loginPath, async (req, res, next) => {
    if (!new Retry(req.ip).canLogin(auth.maxRetries)) {
      const login = await admin.renderLogin({
        action: admin.options.loginPath,
        errorMessage: "tooManyRequests",
        ...providerProps,
      });

      return res.send(login);
    }

    const context: AuthenticationContext = { req, res };

    let adminUser;
    if (provider) {
      adminUser = await provider.handleLogin(
        {
          headers: req.headers,
          query: req.query,
          params: req.params,
          data: req.fields ?? {},
        },
        context
      );
    } else {
      const { email, password } = req.fields as {
        email: string;
        password: string;
      };
      // "auth.authenticate" must always be defined if "auth.provider" isn't
      adminUser = await auth.authenticate!(email, password, context);
    }

    if (adminUser) {
      req.session.adminUser = adminUser;
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        if (req.session.redirectTo) {
          return res.redirect(302, req.session.redirectTo);
        } else {
          return res.redirect(302, rootPath);
        }
      });
    } else {
      const login = await admin.renderLogin({
        action: admin.options.loginPath,
        errorMessage: "invalidCredentials",
        ...providerProps,
      });

      return res.send(login);
    }
  });
};
