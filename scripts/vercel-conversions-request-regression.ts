import { Readable } from "node:stream";
import handler from "../api/conversions.js";

const nodeRequest = Object.assign(Readable.from([]), {
  method: "GET",
  url: "/api/conversions",
  headers: {
    host: "peppol-suite.vercel.app",
    "x-forwarded-proto": "https",
  },
  readable: true,
});

let statusCode = 0;
const headers = new Map<string, string | string[]>();
let body = "";
const response = {
  statusCode,
  setHeader(name: string, value: string | string[]) {
    headers.set(name.toLowerCase(), value);
    return this;
  },
  end(value?: string) {
    body = value ?? "";
  },
};

await handler(nodeRequest, response);
statusCode = response.statusCode;
if (statusCode !== 401) throw new Error(`Unexpected status: ${statusCode}`);
if (headers.get("content-type") !== "application/json; charset=utf-8") throw new Error("Content-Type was not forwarded.");
if (!body.includes("Authentication required.")) throw new Error("Conversion handler did not return its unauthenticated response.");

console.log("Vercel conversion request adapter regression: PASS");
