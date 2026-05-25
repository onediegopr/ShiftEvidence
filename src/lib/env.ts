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
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "",
  HOSTINGER_STORAGE_ROOT: process.env.HOSTINGER_STORAGE_ROOT ?? "./storage",
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB ?? "50",
} as const;
