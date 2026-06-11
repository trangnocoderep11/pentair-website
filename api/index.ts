// @ts-ignore
import appBundle from "../dist/server.cjs";

const app = (appBundle as any).default || appBundle;
const flushPendingWrites = (appBundle as any).flushPendingWrites;

// Direct Vercel handler: passes req/res straight to Express.
// serverless-http defaults to AWS Lambda mode — it returns { statusCode, headers, body }
// instead of writing to res, so Vercel never receives a response and the function times out.
export default function handler(req: any, res: any) {
  return new Promise<void>((resolve) => {
    // Wait for any in-flight DB/Blob persistence writes to finish before letting
    // the function freeze — otherwise newly-saved items can vanish on reload.
    const finish = () => {
      Promise.resolve(flushPendingWrites?.())
        .catch(() => {})
        .finally(resolve);
    };
    res.on("finish", finish);
    res.on("close", finish);
    (app as any)(req, res);
  });
}
