import AdminBro from "admin-bro";
import express from "express";
import mongoose from "mongoose";

import MongooseAdapter from "@admin-bro/mongoose";

AdminBro.registerAdapter(MongooseAdapter);

import AdminBroExpress from "../index";

import "./mongoose/article-model";
import "./mongoose/admin-model";

const start = async () => {
  const connection = await mongoose.connect(
    process.env.MONGO_URL || "mongodb://localhost:27017/example"
  );
  const app = express();

  const adminBro = new AdminBro({
    databases: [connection],
    rootPath: "/admin",
  });
  const router = AdminBroExpress.buildRouter(adminBro);

  app.use(adminBro.options.rootPath, router);

  app.listen(process.env.PORT || 8080, () =>
    console.log("AdminBro is under localhost:8080/admin")
  );
};

start();
