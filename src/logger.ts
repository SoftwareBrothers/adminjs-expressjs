export const log = {
  /**
   * Logs the debug message to console if `process.env.ADMINJS_EXPRESS_DEBUG` is set
   */
  debug: (message: string): void => {
    if (process.env.ADMINJS_EXPRESS_DEBUG) {
      console.debug(message);
    }
  },
};
