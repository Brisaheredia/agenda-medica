import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { Filtro, Franja, Profesional, Turno } from "../types";
import { hoy, moverDia } from "../types";

export function useAgenda({
  api,
  habilitada,
  sesionActiva,
  profesional,
}: {
  api: Api;
  habilitada: boolean;
  sesionActiva: boolean;
  profesional: Profesional | null;
}) {
  const [fecha, setFecha] = useState(() =>
    new URLSearchParams(window.location.search).get("demo") === "1"
      ? moverDia(hoy(), 1)
      : hoy(),
  );
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [revision, setRevision] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorAgenda, setErrorAgenda] = useState("");
  const [selected, setSelected] = useState<Franja | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");

  const key = `${profesional?.id}/${fecha}/${revision}`;
  const ready =
    habilitada &&
    sesionActiva &&
    loadedKey === key &&
    !cargando &&
    !errorAgenda;

  useEffect(() => {
    if (!habilitada || !sesionActiva || !profesional) return;
    const controller = new AbortController();
    setCargando(true);
    setErrorAgenda("");
    setSelected(null);
    const query = `profesionalId=${profesional.id}&fecha=${fecha}`;
    Promise.all([
      api<Franja[]>(`/api/agenda?${query}`, { signal: controller.signal }),
      api<Turno[]>(`/api/turnos?${query}`, { signal: controller.signal }),
    ])
      .then(([franjasDelDia, turnosDelDia]) => {
        setFranjas(franjasDelDia);
        setTurnos(turnosDelDia);
        setLoadedKey(key);
      })
      .catch((error: unknown) => {
        if (!abortado(error)) {
          setErrorAgenda(detalleError(error));
          setFranjas([]);
          setTurnos([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [api, habilitada, sesionActiva, profesional, fecha, key]);

  return {
    fecha,
    setFecha,
    franjas,
    turnos,
    revision,
    setRevision,
    cargando,
    errorAgenda,
    setErrorAgenda,
    selected,
    setSelected,
    filtro,
    setFiltro,
    ready,
  };
}
