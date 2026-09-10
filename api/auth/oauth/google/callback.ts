import handler from "../../[...path].js";

export function GET(request: Request): Response | Promise<Response> {
  return handler(request);
}
