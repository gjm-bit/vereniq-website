import { Readable } from "node:stream";
import app from "../dist/server/index.js";

/** Vercel Node entrypoint for every Vinext public route. */
export default async function handler(req, res) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "localhost";
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else if (value) headers.set(name, value);
  }
  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") { init.body = Readable.toWeb(req); init.duplex = "half"; }
  const requestUrl = new URL(req.url || "/", `${protocol}://${host}`);
  const path = requestUrl.searchParams.get("path");
  if (path) { requestUrl.pathname = path.startsWith("/") ? path : `/${path}`; requestUrl.searchParams.delete("path"); }
  const response = await app.fetch(new Request(requestUrl, init), {});
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  if (!response.body) return res.end();
  Readable.fromWeb(response.body).pipe(res);
}
