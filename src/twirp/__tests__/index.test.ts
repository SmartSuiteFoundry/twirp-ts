import { test, expect } from "@jest/globals";
import * as root from "../index.js";

test("the root entry exports the browser fetch client", () => {
  expect(root.FetchRPC).toBeInstanceOf(Function);
  expect(root.wrapErrorResponseToTwirpError).toBeInstanceOf(Function);
});
