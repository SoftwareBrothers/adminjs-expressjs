import AdminBro, { Router as AdminRouter } from "admin-bro";
import { RequestHandler, Router } from "express";
import formidableMiddleware from "express-formidable";
import path from "path";
import { WrongArgumentError } from "./errors";
import { log } from "./logger";
import { FormidableOptions } from "./types";

const INVALID_ADMIN_BRO_INSTANCE =
  "You have to pass an instance of AdminBro to the buildRouter() function";

export const buildRouter = (
  admin: AdminBro,
  predefinedRouter?: Router | null,
  formidableOptions?: FormidableOptions
): Router => {
  if (admin?.constructor?.name !== "AdminBro") {
    throw new WrongArgumentError(INVALID_ADMIN_BRO_INSTANCE);
  }

  admin.initialize().then(() => {
    log.debug("AdminBro: bundle ready");
  });

  const { routes, assets } = AdminRouter;
  const router = predefinedRouter ?? Router();
  router.use(formidableMiddleware(formidableOptions));

  routes.forEach((route) => {
    // we have to change routes defined in AdminBro from {recordId} to :recordId
    const expressPath = route.path.replace(/{/g, ":").replace(/}/g, "");

    const handler: RequestHandler = async (req, res, next) => {
      try {
        const controller = new route.Controller(
          { admin },
          req.session && req.session.adminUser
        );
        const { params, query } = req;
        const method = req.method.toLowerCase();
        const payload = {
          ...(req.fields || {}),
          ...(req.files || {}),
        };
        const html = await controller[route.action](
          {
            ...req,
            params,
            query,
            payload,
            method,
          },
          res
        );
        if (route.contentType) {
          res.set({ "Content-Type": route.contentType });
        }
        if (html) {
          res.send(html);
        }
      } catch (e) {
        next(e);
      }
    };

    if (route.method === "GET") {
      router.get(expressPath, handler);
    }

    if (route.method === "POST") {
      router.post(expressPath, handler);
    }
  });

  assets.forEach((asset) => {
    router.get(asset.path, async (req, res) => {
      res.sendFile(path.resolve(asset.src));
    });
  });

  return router;
};
