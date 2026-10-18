import type { Rol } from "./types";

export const roles: Rol[] = ["ADMIN", "MEDICO", "RECEPCION", "OBRAS_SOCIALES"];
export const nombresRol: Record<Rol, string> = {
  ADMIN: "Administración", MEDICO: "Médico", RECEPCION: "Recepción", OBRAS_SOCIALES: "Obras sociales",
};

// La API controla estos permisos por separado; esta matriz adapta la interfaz.
export function permisosDe(rol: Rol | undefined) {
  return {
    gestionarPacientes: rol === "ADMIN" || rol === "RECEPCION",
    gestionarTurnos: rol === "ADMIN" || rol === "RECEPCION" || rol === "OBRAS_SOCIALES",
    gestionarHorarios: rol === "ADMIN" || rol === "MEDICO",
    registrarResultados: rol === "ADMIN" || rol === "MEDICO" || rol === "RECEPCION",
    administrar: rol === "ADMIN",
    verContactos: rol === "ADMIN" || rol === "MEDICO" || rol === "RECEPCION",
    cancelarPorConsultorio: rol === "ADMIN" || rol === "RECEPCION",
  };
}
