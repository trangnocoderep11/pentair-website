import appInstance from "../dist/server.cjs";

// Safe wrapper for CommonJS/ESM compatibility
const app = (appInstance as any).default || appInstance;

export default app;
