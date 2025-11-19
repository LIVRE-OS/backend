declare module "cors" {
  import type { IncomingMessage, ServerResponse } from "http";

  type CorsNext = (err?: Error) => void;

  export interface CorsOptions {
    origin?: string | string[];
    methods?: string | string[];
    allowedHeaders?: string | string[];
  }

  export type CorsMiddleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: CorsNext
  ) => void;

  export default function cors(options?: CorsOptions): CorsMiddleware;
}
