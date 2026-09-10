import { Readable } from "node:stream";
import { nodeRequestToWebRequest } from "../api/usage.js";

const nodeRequest = Object.assign(Readable.from([Buffer.from(JSON.stringify({ kind: "conversion" }))]), {
  method: "POST",
  url: "/api/usage?test=1",
  headers: {
    host: "peppol-suite.vercel.app",
    "x-forwarded-proto": "https",
    cookie: "peppol_session=test-token",
    origin: "https://peppol-suite.vercel.app",
    "user-agent": "regression-test",
  },
  readable: true,
});

const request = await nodeRequestToWebRequest(nodeRequest);
if (!(request instanceof Request)) throw new Error("Adapter did not return a Web Request.");
if (request.url !== "https://peppol-suite.vercel.app/api/usage?test=1") throw new Error(`Unexpected URL: ${request.url}`);
if (request.headers.get("cookie") !== "peppol_session=test-token") throw new Error("Cookie header was not adapted.");
if (request.headers.get("origin") !== "https://peppol-suite.vercel.app") throw new Error("Origin header was not adapted.");
if (request.method !== "POST") throw new Error(`Unexpected method: ${request.method}`);
const body = await request.json() as { kind?: string };
if (body.kind !== "conversion") throw new Error("Request body was not adapted.");

console.log("Vercel usage request adapter regression: PASS");
