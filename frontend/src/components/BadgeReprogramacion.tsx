import type { Turno } from "../types";

export function BadgeReprogramacion({ turno }: { turno: Turno }) {
  if (!turno.reprogramadoPorConsultorio) return null;
  return <span className="badge badge-reprogramacion" title="Este turno se trasladó después de una suspensión del consultorio.">
    Reprogramado por el consultorio
  </span>;
}
