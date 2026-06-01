/** In dev, default to same-origin so Vite can proxy API routes and avoid CORS issues */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3000')
/** In dev, use same origin so Vite proxies /socket.io to the API server */
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.DEV ? '' : API_BASE_URL)
