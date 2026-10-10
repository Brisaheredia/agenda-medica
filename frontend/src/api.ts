import type { Sesion } from './types'
const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export function crearApi(sesion: Sesion | null, salir: () => void) {
  return async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(base + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(sesion ? { Authorization: `Bearer ${sesion.token}` } : {}), ...options.headers },
    })
    if (!response.ok) {
      let message = 'No se pudo completar la operación. Intentá nuevamente.'
      try { const body = await response.json(); message = body.message ?? body.error ?? message } catch { /* Response without JSON. */ }
      if (response.status === 401) { if (sesion) salir(); message = sesion ? 'Tu sesión venció. Volvé a ingresar.' : 'Email o contraseña incorrectos.' }
      if (response.status === 403) message = 'No tenés permisos para realizar esta operación.'
      throw new ApiError(response.status, message)
    }
    if (response.status === 204) return undefined as T
    return response.json()
  }
}
export type Api = ReturnType<typeof crearApi>
export const detalleError = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación.'
export const abortado = (error: unknown) => error instanceof Error && error.name === 'AbortError'
