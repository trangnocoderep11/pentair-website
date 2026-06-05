import serverless from "serverless-http";
import app from "../dist/server.cjs";

export default serverless(app as any);
