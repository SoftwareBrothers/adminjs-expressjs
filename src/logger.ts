export const log = {
  debug: (message: string): void => {
    if (process.env.ADMIN_BRO_EXPRESS_DEBUG) {
      console.debug(message);
    }
  },
};
