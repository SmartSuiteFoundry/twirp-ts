import { jest } from "@jest/globals";

// Browser bundles polyfill `url` without a `URL` export, so the client must use the global.
jest.unstable_mockModule("url", () => ({}));

test("loads where the url module has no URL export", async () => {
  const { NodeHttpRPC } = await import("../node-http.client.js");
  expect(NodeHttpRPC).toBeInstanceOf(Function);
});
