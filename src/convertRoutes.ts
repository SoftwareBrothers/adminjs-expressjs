export const convertToExpressRoute = (adminRoute: string): string =>
  adminRoute.replace(/{/g, ":").replace(/}/g, "");
