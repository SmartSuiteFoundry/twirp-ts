import express from "express";
import { jsonClient, protobufClient } from "./client.js";
import { createGateway } from "./generated/gateway.twirp.js";
import type { FindHatRPC, Hat, ListHatRPC } from "./generated/service.js";
import { createHaberdasherServer } from "./generated/service.twirp.js";

const server = createHaberdasherServer({
  async MakeHat(_ctx, request): Promise<Hat> {
    return {
      id: "",
      name: "cup",
      inches: request.inches,
      color: "blue",
      variants: [],
    };
  },
  async FindHat(_ctx, request): Promise<FindHatRPC> {
    return request;
  },
  async ListHat(_ctx, request): Promise<ListHatRPC> {
    return request;
  },
});

const app = express();
const gateway = createGateway();

app.use(gateway.twirpRewrite());
app.post(server.matchingPath(), server.httpHandler());

const listener = app.listen(8000, async () => {
  try {
    console.log(
      "response from JSON client",
      await jsonClient.MakeHat({ inches: 2 }),
    );
    console.log(
      "response from Protobuf client",
      await protobufClient.MakeHat({ inches: 1 }),
    );

    const gatewayResp = await fetch("http://localhost:8000/hat/abc");
    console.log("response from gateway", await gatewayResp.json());
  } finally {
    listener.close();
  }
});
