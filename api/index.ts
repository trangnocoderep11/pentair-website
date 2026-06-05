import serverless from "serverless-http";
import appBundle from "../dist/server.cjs";

const app = (appBundle as any).default || appBundle;

export default serverless(app as any);
