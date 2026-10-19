import type * as http from "http";
import type { TwirpContentType } from "./request.js";

export interface TwirpContext<
  Request = http.IncomingMessage,
  Response = http.ServerResponse
> {
  readonly packageName: string;
  readonly serviceName: string;
  methodName: string;

  readonly contentType: TwirpContentType;
  readonly req: Request;
  readonly res: Response;
}
