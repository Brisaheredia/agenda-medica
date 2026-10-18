import type { Api } from "../api";
import { CalendarioSemanalAgenda } from "./CalendarioSemanalAgenda";

export function CalendarioSemanalDisponibilidad(props: {
  profesionalId: number | undefined;
  api: Api;
  revision?: number;
  verContactos?: boolean;
}) {
  return <CalendarioSemanalAgenda {...props} />;
}
