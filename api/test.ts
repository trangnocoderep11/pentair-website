export default function handler(req: any, res: any) {
  res.json({ 
    ok: true, 
    msg: "isolated function works", 
    ts: Date.now(),
    env: {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    }
  });
}
