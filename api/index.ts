// @ts-ignore
import appBundle from "../dist/server.cjs";

const app = (appBundle as any).default || appBundle;

// Direct Vercel handler: passes req/res straight to Express.
// serverless-http defaults to AWS Lambda mode — it returns { statusCode, headers, body }
// instead of writing to res, so Vercel never receives a response and the function times out.
export default function handler(req: any, res: any) {
  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    (app as any)(req, res);
  });
}
