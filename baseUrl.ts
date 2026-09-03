export const baseURL =
  process.env.BASE_URL ??
  process.env.APP_ORIGIN ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL}`
        : "http://localhost:3000");
