import { Readable } from "node:stream";
import apiKeysHandler from "../api/api-keys.js";
import adminUsersHandler from "../api/admin/users.js";

function makeResponse() {
  const headers = new Map<string, string | string[]>();
  let statusCode = 0;
  let body = "";
  return {
    response: {
      get statusCode() { return statusCode; },
      set statusCode(value: number | undefined) { statusCode = value ?? 0; },
      setHeader(name: string, value: string | string[]) { headers.set(name.toLowerCase(), value); return this; },
      end(value?: string) { body = value ?? ""; },
    },
    read: () => ({ statusCode, body, contentType: headers.get("content-type") }),
  };
}

async function check(handler: (request: unknown, response: unknown) => Promise<void>, name: string) {
  const nodeRequest = Object.assign(Readable.from([]), {
    method: "GET",
    url: `/api/${name}`,
    headers: { host: "peppol-suite.vercel.app", "x-forwarded-proto": "https" },
    readable: true,
  });
  const out = makeResponse();
  await handler(nodeRequest, out.response);
  const result = out.read();
  if (result.statusCode !== 401) throw new Error(`${name}: unexpected status ${result.statusCode}`);
  if (result.contentType !== "application/json; charset=utf-8") throw new Error(`${name}: Content-Type was not forwarded`);
  if (!result.body.includes("Authentication required.")) throw new Error(`${name}: missing unauthenticated response`);
}

await check(apiKeysHandler, "api-keys");
await check(adminUsersHandler, "admin/users");
console.log("Vercel API auth adapter regression: PASS");
