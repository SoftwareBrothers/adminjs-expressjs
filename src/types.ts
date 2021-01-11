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

export type AuthenticationOptions = {
  cookiePassword: string;
  cookieName?: string;
  authenticate: (email: string, password: string) => unknown | null;
};
