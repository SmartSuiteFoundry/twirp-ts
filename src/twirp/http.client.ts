import { TwirpError } from "./errors.js";

export interface Rpc {
  request(
    service: string,
    method: string,
    contentType: "application/json" | "application/protobuf",
    data: object | Uint8Array,
  ): Promise<object | Uint8Array>;
}

export function wrapErrorResponseToTwirpError(errorResponse: string) {
  return TwirpError.fromObject(JSON.parse(errorResponse));
}

export type FetchRPCOptions = Omit<RequestInit, "body" | "method"> & {
  baseUrl: string;
};

/**
 * a browser fetch RPC implementation
 */
export const FetchRPC: (options: FetchRPCOptions) => Rpc = (options) => ({
  async request(
    service,
    method,
    contentType,
    data,
  ): Promise<object | Uint8Array> {
    const headers = new Headers(options.headers);
    headers.set("content-type", contentType);

    const response = await fetch(`${options.baseUrl}/${service}/${method}`, {
      ...options,
      method: "POST",
      headers,
      body:
        data instanceof Uint8Array
          ? (data as unknown as BodyInit)
          : JSON.stringify(data),
    });

    if (response.status === 200) {
      if (contentType === "application/json") {
        return await response.json();
      }
      return new Uint8Array(await response.arrayBuffer());
    }

    throw TwirpError.fromObject(await response.json());
  },
});
