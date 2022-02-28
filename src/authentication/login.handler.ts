import AdminJS from "adminjs";
import { Router } from "express";
import {
  AuthenticationMaxRetriesOptions,
  AuthenticationOptions,
} from "../types";

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

  router.get(loginPath, async (req, res) => {
    const login = await admin.renderLogin({
      action: admin.options.loginPath,
      errorMessage: null,
    });
    res.send(login);
  });

  router.post(loginPath, async (req, res, next) => {
    if (!new Retry(req.ip).canLogin(auth.maxRetries)) {
      const login = await admin.renderLogin({
        action: admin.options.loginPath,
        errorMessage: "tooManyRequests",
      });
      res.send(login);
      return;
    }
    const { email, password } = req.fields as {
      email: string;
      password: string;
    };
    const adminUser = await auth.authenticate(email, password);
    if (adminUser) {
      req.session.adminUser = adminUser;
      req.session.save((err) => {
        if (err) {
          next(err);
        }
        if (req.session.redirectTo) {
          res.redirect(302, req.session.redirectTo);
        } else {
          res.redirect(302, rootPath);
        }
      });
    } else {
      const login = await admin.renderLogin({
        action: admin.options.loginPath,
        errorMessage: "invalidCredentials",
      });
      res.send(login);
    }
  });
};
