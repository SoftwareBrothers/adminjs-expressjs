import { isAdminRoute } from "../src/authentication/protected-routes.handler";

describe("Protected routes", () => {
  describe("#isAdminRoute", () => {
    it("should detect admin routes", () => {
      const adminRoutes = [
        "/",
        "/resources/someResource",
        "/api/resources/someResource/search/searchQuery",
        "/resources/someResource/actions/someAction",
        "/api/resources/someResource/actions/someAction",
        "/api/resources/someResource/actions/someAction/searchQuery",
        "/api/resources/someResource/actions/someAction",
        "/resources/someResource/records/someRecordId/someAction",
        "/api/resources/someResource/records/someRecordId/someAction",
        "/api/resources/someResource/records/someRecordId/someAction",
        "/resources/someResource/bulk/someAction",
        "/api/resources/someResource/bulk/someAction",
        "/api/resources/someResource/bulk/someAction",
        "/api/resources/someResource/search/",
        "/api/dashboard",
        "/pages/somePage",
        "/api/pages/somePage",
        "/api/pages/somePage",
      ];

      adminRoutes.forEach((route) => {
        expect(isAdminRoute(route, "/")).toBeTruthy();
      });
    });

    it("should detect non-admin routes", () => {
      expect(isAdminRoute("/api/my-endpoint", "/")).toBeFalsy();
    });

    it("should detect admin routes with base url", () => {
      expect(
        isAdminRoute("/admin/resources/someResource/actions/new", "/admin")
      ).toBeTruthy();
    });
  });
});
