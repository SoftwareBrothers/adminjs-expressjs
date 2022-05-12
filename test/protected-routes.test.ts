import { isAdminRoute } from "../src/authentication/protected-routes.handler";

describe("Protected routes", () => {
  describe("#isAdminRoute", () => {
    it("should detect admin routes when root path is /", () => {
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

    it("should detect admin routes when root path is not /", () => {
      const adminRoutes = [
        "/admin",
        "/admin/resources/someResource",
        "/admin/api/resources/someResource/search/searchQuery",
        "/admin/resources/someResource/actions/someAction",
        "/admin/api/resources/someResource/actions/someAction",
        "/admin/api/resources/someResource/actions/someAction/searchQuery",
        "/admin/api/resources/someResource/actions/someAction",
        "/admin/resources/someResource/records/someRecordId/someAction",
        "/admin/api/resources/someResource/records/someRecordId/someAction",
        "/admin/api/resources/someResource/records/someRecordId/someAction",
        "/admin/resources/someResource/bulk/someAction",
        "/admin/api/resources/someResource/bulk/someAction",
        "/admin/api/resources/someResource/bulk/someAction",
        "/admin/api/resources/someResource/search/",
        "/admin/api/dashboard",
        "/admin/pages/somePage",
        "/admin/api/pages/somePage",
        "/admin/api/pages/somePage",
      ];

      adminRoutes.forEach((route) => {
        expect(isAdminRoute(route, "/admin")).toBeTruthy();
      });
    });

    it("should detect admin routes when query params are included", () => {
      const route =
        "/resources/someResource/actions/list?filters.someFilter=123";

      expect(isAdminRoute(route, "/")).toBeTruthy();
    });

    it("should detect admin routes when query params are included and root path is not /", () => {
      const route =
        "/admin/resources/someResource/actions/list?filters.someFilter=123";

      expect(isAdminRoute(route, "/admin")).toBeTruthy();
    });

    it("should not detect admin routes when query params are included but root is different", () => {
      const route =
        "/resources/someResource/actions/list?filters.someFilter=123";

      expect(isAdminRoute(route, "/admin")).toBeFalsy();
    });

    it("should detect non-admin routes when root path is /", () => {
      expect(isAdminRoute("/api/my-endpoint", "/")).toBeFalsy();
    });

    it("should detect non-admin routes when root path is not /", () => {
      expect(isAdminRoute("/admin/api/my-endpoint", "/admin")).toBeFalsy();
    });
  });
});
