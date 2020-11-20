export {};

declare module "express-session" {
  interface SessionData {
    adminUser?: unknown;
    redirectTo?: string;
  }
}
