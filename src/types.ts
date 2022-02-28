export type FormidableOptions = {
  encoding?: string;
  uploadDir?: string;
  keepExtensions?: boolean;
  type?: "multipart" | "urlencoded";
  maxFileSize?: number;
  maxFieldsSize?: number;
  maxFields?: number;
  hash?: boolean | "sha1" | "md5";
  multiples?: boolean;
};

export type AuthenticationMaxRetriesOptions = {
  /**
   * @description Count of retries
   */
  count: number;
  /**
   * @description Time to reset (in seconds)
   */
  duration: number;
};

export type AuthenticationOptions = {
  cookiePassword: string;
  cookieName?: string;
  authenticate: (email: string, password: string) => unknown | null;
  /**
   * @description Maximum number of authorization attempts (if number - per minute)
   */
  maxRetries?: number | AuthenticationMaxRetriesOptions;
};
