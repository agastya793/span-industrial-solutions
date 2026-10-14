declare module 'cloudflare:node' {
  export function httpServerHandler(
    serverOrOptions: any
  ): {
    fetch: (request: Request, env?: any, ctx?: any) => Promise<Response> | Response;
  };
}

declare module 'cloudflare:workers' {
  export const env: any;
}
