import { FetchRPC } from "@smartsuite-foundry/twirp-ts";
import { NodeHttpRPC } from "@smartsuite-foundry/twirp-ts/server";
import {
  HaberdasherClientJSON,
  HaberdasherClientProtobuf,
} from "./generated/service.twirp.js";

const baseUrl = "http://localhost:8000/twirp";

export const jsonClient = new HaberdasherClientJSON(FetchRPC({ baseUrl }));

// NodeHttpRPC uses node's http/https modules directly, for runtimes without fetch
export const protobufClient = new HaberdasherClientProtobuf(
  NodeHttpRPC({ baseUrl }),
);
