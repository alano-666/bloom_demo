process.env.VERCEL = "1";
const { app } = await import("../apps/api/src/index.ts");
export default app;
