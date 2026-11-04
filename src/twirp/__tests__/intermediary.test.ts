import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "@jest/globals";
import { TwirpError, TwirpErrorCode } from "../errors.js";
import { FetchRPC, type Rpc } from "../http.client.js";
import { NodeHttpRPC } from "../node-http.client.js";

let server: http.Server | undefined;

afterEach(async () => {
  await new Promise((resolve) => server?.close(resolve));
  server = undefined;
});

const respondWith = async (
  status: number,
  contentType: string,
  body: string,
): Promise<string> => {
  server = http.createServer((_req, res) => {
    res.writeHead(status, { "content-type": contentType });
    res.end(body);
  });
  await new Promise<void>((resolve) => server?.listen(0, resolve));
  return `http://localhost:${(server.address() as AddressInfo).port}`;
};

const failure = async (rpc: Rpc): Promise<TwirpError> => {
  try {
    await rpc.request("Service", "Method", "application/json", {});
  } catch (e) {
    return e as TwirpError;
  }
  throw new Error("the request succeeded");
};

const clients: [string, (baseUrl: string) => Rpc][] = [
  ["FetchRPC", (baseUrl) => FetchRPC({ baseUrl })],
  ["NodeHttpRPC", (baseUrl) => NodeHttpRPC({ baseUrl })],
];

describe.each(clients)("%s", (_name, makeRpc) => {
  it("passes a twirp error through", async () => {
    const baseUrl = await respondWith(
      404,
      "application/json",
      JSON.stringify({ code: "not_found", msg: "no hat", meta: { a: "b" } }),
    );

    const err = await failure(makeRpc(baseUrl));

    expect(err).toBeInstanceOf(TwirpError);
    expect(err.code).toBe(TwirpErrorCode.NotFound);
    expect(err.msg).toBe("no hat");
    expect(err.meta).toEqual({ a: "b" });
  });

  it.each([
    [401, TwirpErrorCode.Unauthenticated],
    [403, TwirpErrorCode.PermissionDenied],
    [404, TwirpErrorCode.BadRoute],
    [400, TwirpErrorCode.Internal],
    [429, TwirpErrorCode.Unavailable],
    [503, TwirpErrorCode.Unavailable],
    [500, TwirpErrorCode.Unknown],
  ])("maps an intermediary's %i to %s", async (status, code) => {
    const body = JSON.stringify({ message: "explicit deny" });
    const baseUrl = await respondWith(status, "application/json", body);

    const err = await failure(makeRpc(baseUrl));

    expect(err).toBeInstanceOf(TwirpError);
    expect(err.code).toBe(code);
    expect(err.meta).toEqual({
      http_error_from_intermediary: "true",
      status_code: String(status),
      body,
    });
  });

  it("maps an intermediary's non-json body", async () => {
    const baseUrl = await respondWith(502, "text/html", "<h1>Bad Gateway</h1>");

    const err = await failure(makeRpc(baseUrl));

    expect(err).toBeInstanceOf(TwirpError);
    expect(err.code).toBe(TwirpErrorCode.Unavailable);
    expect(err.meta.body).toBe("<h1>Bad Gateway</h1>");
  });
});
