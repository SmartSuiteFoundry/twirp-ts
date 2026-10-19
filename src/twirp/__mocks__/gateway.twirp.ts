import { match } from "path-to-regexp";
import { Gateway, type Pattern } from "../node.js";

export function createGateway() {
  return new Gateway({
    post: [
      {
        packageName: "twirp.example.haberdasher",
        methodName: "MakeHat",
        serviceName: "Haberdasher",
        httpMethod: "post" as Pattern,
        matchingPath: "/hat",
        matcher: match("/hat"),
        bodyKey: "*",
        responseBodyKey: "",
      },
    ],
    get: [
      {
        packageName: "twirp.example.haberdasher",
        methodName: "FindHat",
        serviceName: "Haberdasher",
        httpMethod: "get" as Pattern,
        matchingPath: "/hat/:hat_id",
        matcher: match("/hat/:hat_id"),
        bodyKey: "",
        responseBodyKey: "",
      },
      {
        packageName: "twirp.example.haberdasher",
        methodName: "ListHat",
        serviceName: "Haberdasher",
        httpMethod: "get" as Pattern,
        matchingPath: "/hat",
        matcher: match("/hat"),
        bodyKey: "",
        responseBodyKey: "",
      },
    ],
    put: [],
    patch: [],
    delete: [],
  });
}
