import AdminBro from "admin-bro";
import express from "express";
import mongoose from "mongoose";
import MongooseAdapter from "@admin-bro/mongoose";
import AdminBroExpress from "../src";

import "./mongoose/article-model";
import "./mongoose/admin-model";

AdminBro.registerAdapter(MongooseAdapter);

const ADMIN = {
  email: "test@example.com",
  password: "password",
};

const start = async () => {
  const connection = await mongoose.connect(
    process.env.MONGO_URL || "mongodb://localhost:27017/example"
  );
  const app = express();

  const adminBro = new AdminBro({
    databases: [connection],
    rootPath: "/admin",
  });

  const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
    authenticate: async (email, password) => {
      if (ADMIN.password === password && ADMIN.email === email) {
        return ADMIN;
      }
      return null;
    },
    cookiePassword: "somasd1nda0asssjsdhb21uy3g",
  });

  app.use(adminBro.options.rootPath, router);

  app.listen(process.env.PORT || 8080, () =>
    console.log("AdminBro is under localhost:8080/admin")
  );
};

start();
