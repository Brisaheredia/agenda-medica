import { useEffect, useRef, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { ExcepcionAgenda, Filtro, Franja, Profesional, Turno } from "../types";
import { hoy } from "../types";
import { franjasParaMostrar } from "../lib/agendaVisual";

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
  const [fecha, setFecha] = useState(() => hoy());
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionAgenda[]>([]);
  const [revision, setRevision] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorAgenda, setErrorAgenda] = useState("");
  const [selected, setSelected] = useState<Franja | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const pendingFranjaId = useRef<number | null>(null);

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
      api<ExcepcionAgenda[]>(`/api/agenda/excepciones?profesionalId=${profesional.id}&desde=${fecha}&hasta=${fecha}`, { signal: controller.signal }),
    ])
      .then(([franjasDelDia, turnosDelDia, excepcionesDelDia]) => {
        const franjasVisibles = franjasParaMostrar(franjasDelDia, turnosDelDia);
        setFranjas(franjasVisibles);
        setTurnos(turnosDelDia);
        setExcepciones(excepcionesDelDia);
        if (pendingFranjaId.current !== null) {
          const seleccionada = franjasVisibles.find(
            (franja) => franja.id === pendingFranjaId.current,
          );
          if (seleccionada) setSelected(seleccionada);
          pendingFranjaId.current = null;
        }
        setLoadedKey(key);
      })
      .catch((error: unknown) => {
        if (!abortado(error)) {
          setErrorAgenda(detalleError(error));
          setFranjas([]);
          setTurnos([]);
          setExcepciones([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [api, habilitada, sesionActiva, profesional, fecha, key]);

  function irAFranja(franja: Franja) {
    const fechaFranja = franja.inicio.slice(0, 10);
    if (fechaFranja === fecha) {
      setSelected(franja);
      return;
    }
    pendingFranjaId.current = franja.id;
    setFecha(fechaFranja);
    setFiltro("TODOS");
  }

  return {
    fecha,
    setFecha,
    franjas,
    turnos,
    excepciones,
    revision,
    setRevision,
    cargando,
    errorAgenda,
    setErrorAgenda,
    selected,
    setSelected,
    irAFranja,
    filtro,
    setFiltro,
    ready,
  };
}
