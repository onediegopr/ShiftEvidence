const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the ShiftReadiness foundation.`);
  }

  return value;
};

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: required("BETTER_AUTH_URL"),
  NEXT_PUBLIC_APP_URL: required("NEXT_PUBLIC_APP_URL"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  PREVIEW_TRUSTED_ORIGINS: process.env.PREVIEW_TRUSTED_ORIGINS ?? "",
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "",
  STORAGE_DRIVER: process.env.STORAGE_DRIVER?.trim() || "local",
  HOSTINGER_STORAGE_ROOT: process.env.HOSTINGER_STORAGE_ROOT?.trim() || "./storage",
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB ?? "50",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID?.trim() ?? "",
  R2_S3_ENDPOINT: process.env.R2_S3_ENDPOINT?.trim() ?? "",
  R2_BUCKET_PREVIEW: process.env.R2_BUCKET_PREVIEW?.trim() ?? "",
  R2_BUCKET_PROD: process.env.R2_BUCKET_PROD?.trim() ?? "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID?.trim() ?? "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "",
} as const;
