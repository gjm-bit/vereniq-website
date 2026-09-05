import { Readable } from "node:stream";
import app from "../dist/server/index.js";

// STRUCTURELE FIX (IndexNow request-body transportprobleem): dit bestand
// bouwde een inkomende non-GET/HEAD-request voorheen op met een STREAMENDE body
// (`init.body = Readable.toWeb(req)`). Een reeks first-party productiemetingen
// (drie afzonderlijke, isoleerbare diagnoserondes) heeft aangetoond dat de
// kale Node `http.IncomingMessage` een POST-body op deze Vercel Node 24.x
// runtime altijd volledig en vrijwel ogenblikkelijk ontvangt (`end`/`complete`
// binnen enkele ms, bytes exact overeenkomend met `Content-Length`) zodra
// `Readable.toWeb(req)` NIET wordt gebruikt - maar dat de bestaande route
// (`app/api/indexnow/submit`, via vinext se `NextRequest`/App Router-laag)
// de body nooit volledig kon lezen zodra die WEL via `Readable.toWeb(req)`
// werd doorgegeven. De foutgrens ligt dus aantoonbaar in de streaming-brug
// hieronder, niet in Vercel's ruwe requesttransport en niet (meer) in
// vinext's eigen `NextRequest`-tee/clone-bug (al gefixed in vinext
// 1.0.0-beta.5).
//
// Fix: de volledige body eerst zelf uitlezen tot één `Buffer` (`readBody()`
// hieronder, met kale `req.on('data')/'end'/'error')`), en die `Buffer` -
// in plaats van een streamende `ReadableStream` - als `init.body` meegeven.
// Een `Buffer` is een `Uint8Array`-subklasse en dus een geldige Fetch-body
// zonder enige streaming-/tee-/lock-gevoeligheid; `duplex: "half"` is dan
// niet meer nodig (dat is uitsluitend vereist bij een streamende body).
//
// Deze routes zijn kleine, API-only JSON-eindpunten (ruim onder Vercel's
// bestaande 4.5MB-bodylimiet) - vooraf volledig bufferen introduceert hier
// geen relevante geheugendruk en behoudt alle bestaande semantiek (method,
// headers, content-type, content-length, querystring, cookies, auth) exact;
// alleen HOE de body aan `Request` wordt meegegeven verandert.
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

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
  if (req.method !== "GET" && req.method !== "HEAD") { init.body = await readBody(req); }
  const requestUrl = new URL(req.url || "/", `${protocol}://${host}`);
  const path = requestUrl.searchParams.get("path");
  if (path) { requestUrl.pathname = path.startsWith("/") ? path : `/${path}`; requestUrl.searchParams.delete("path"); }
  const response = await app.fetch(new Request(requestUrl, init), {});
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  if (!response.body) return res.end();
  Readable.fromWeb(response.body).pipe(res);
}
