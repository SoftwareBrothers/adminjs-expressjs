import AdminJS from "adminjs";
import express from "express";
import { buildRouter } from "../src/buildRouter";

describe("plugin", () => {
  describe(".buildRouter", () => {
    it("returns an express router when AdminJS instance given as an argument", () => {
      expect(buildRouter(new AdminJS())).toBeInstanceOf(
        express.Router().constructor
      );
    });
  });
});
