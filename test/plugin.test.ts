import express from "express";
import AdminBro from "admin-bro";
import { buildRouter } from "../src/buildRouter";

describe("plugin", () => {
  describe(".buildRouter", () => {
    it("returns an express router when AdminBro instance given as an argument", () => {
      expect(buildRouter(new AdminBro())).toBeInstanceOf(
        express.Router().constructor
      );
    });
  });
});
