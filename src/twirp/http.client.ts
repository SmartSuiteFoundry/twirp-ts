import { isValidErrorCode, TwirpError, TwirpErrorCode } from "./errors.js";

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

/**
 * Builds the error for a non-200 response. A Twirp server answers with a JSON
 * error carrying a valid code; anything else came from an intermediary - a
 * gateway, proxy or load balancer - and is mapped from its HTTP status as the
 * Twirp spec describes, with the status and body kept in meta.
 */
export function twirpErrorFromResponse(
  status: number,
  body: string,
): TwirpError {
  try {
    const parsed = JSON.parse(body);
    if (
      typeof parsed?.code === "string" &&
      isValidErrorCode(parsed.code as TwirpErrorCode)
    ) {
      return TwirpError.fromObject(parsed);
    }
  } catch {}

  return new TwirpError(
    intermediaryErrorCode(status),
    `Error from intermediary with HTTP status code ${status}`,
  )
    .withMeta("http_error_from_intermediary", "true")
    .withMeta("status_code", String(status))
    .withMeta("body", body);
}

function intermediaryErrorCode(status: number): TwirpErrorCode {
  if (status >= 300 && status < 400) {
    return TwirpErrorCode.Internal;
  }
  switch (status) {
    case 400:
      return TwirpErrorCode.Internal;
    case 401:
      return TwirpErrorCode.Unauthenticated;
    case 403:
      return TwirpErrorCode.PermissionDenied;
    case 404:
      return TwirpErrorCode.BadRoute;
    case 429:
    case 502:
    case 503:
    case 504:
      return TwirpErrorCode.Unavailable;
    default:
      return TwirpErrorCode.Unknown;
  }
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

    throw twirpErrorFromResponse(response.status, await response.text());
  },
});
