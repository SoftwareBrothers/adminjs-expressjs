import AdminJS, { Router as AdminRouter } from "adminjs";
import { RequestHandler, Router } from "express";
import formidableMiddleware from "express-formidable";
import path from "path";
import { WrongArgumentError } from "./errors";
import { log } from "./logger";
import { FormidableOptions } from "./types";
import { convertToExpressRoute } from "./convertRoutes";

const INVALID_ADMINJS_INSTANCE =
  "You have to pass an instance of AdminJS to the buildRouter() function";

export const buildRouter = (
  admin: AdminJS,
  predefinedRouter?: Router | null,
  formidableOptions?: FormidableOptions
): Router => {
  if (admin?.constructor?.name !== "AdminJS") {
    throw new WrongArgumentError(INVALID_ADMINJS_INSTANCE);
  }

  admin.initialize().then(() => {
    log.debug("AdminJS: bundle ready");
  });

  const { routes, assets } = AdminRouter;
  const router = predefinedRouter ?? Router();
  router.use(formidableMiddleware(formidableOptions));

  routes.forEach((route) => {
    // we have to change routes defined in AdminJS from {recordId} to :recordId
    const expressPath = convertToExpressRoute(route.path);

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
