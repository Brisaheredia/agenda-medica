export type Rol = "ADMIN" | "RECEPCION" | "MEDICO" | "OBRAS_SOCIALES";
export type Sesion = { token: string; email: string; rol: Rol };
export type Profesional = {
  id: number;
  nombre: string;
  apellido: string;
  activo: boolean;
};
export type Paciente = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  activo: boolean;
};
export type NuevoPaciente = {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
};
export type Franja = {
  id: number;
  profesionalId: number;
  inicio: string;
  fin: string;
  estado: "LIBRE" | "OCUPADA" | "BLOQUEADA";
  origen: string;
};
export type Turno = {
  id: number;
  pacienteId: number;
  paciente: string;
  profesionalId: number;
  franjaId: number;
  inicio: string;
  fin: string;
  estado: "RESERVADO" | "CONFIRMADO" | "CANCELADO" | "ATENDIDO" | "AUSENTE";
  motivoConsulta?: string;
  origenCancelacion?: "PACIENTE" | "CONSULTORIO" | null;
  motivoCancelacion?: string | null;
};
export type ExcepcionAgenda = {
  id: number;
  profesionalId: number;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  tipo: "CIERRE" | "APERTURA";
  motivo: string | null;
};
export type TurnoAfectado = {
  turno: Turno;
  dni: string;
  telefono: string | null;
  email: string | null;
  motivo: string | null;
};
export type Filtro =
  | "TODOS"
  | "LIBRE"
  | "RESERVADO"
  | "ATENDIDO"
  | "AUSENTE"
  | "BLOQUEADA"
  | "CANCELADO";
export const activo = (turno: Turno) =>
  turno.estado === "RESERVADO" || turno.estado === "CONFIRMADO";
export const reservable = (franja: Franja) =>
  franja.estado === "LIBRE" && new Date(franja.inicio).getTime() > Date.now()
  && new Date(franja.fin).getTime() - new Date(franja.inicio).getTime() === 40 * 60_000;
export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function moverDia(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const hora = (valor: string) =>
  new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(valor));
export const fechaLarga = (valor: string) =>
  new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${valor}T12:00:00`));
export const etiquetas: Record<string, string> = {
  LIBRE: "Disponible",
  OCUPADA: "Ocupado",
  BLOQUEADA: "Bloqueado",
  RESERVADO: "Reservado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  AUSENTE: "Ausente",
  CANCELADO: "Cancelado",
};
