import { useCallback, useEffect, useRef, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { TurnoAfectado } from "../types";

export function useReprogramaciones({ api, profesionalId, habilitada }: {
  api: Api;
  profesionalId?: number;
  habilitada: boolean;
}) {
  const [pendientes, setPendientes] = useState<TurnoAfectado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");
  const peticion = useRef<AbortController | null>(null);

  const actualizar = useCallback(async () => {
    if (!habilitada || !profesionalId) return;
    peticion.current?.abort();
    const controller = new AbortController();
    peticion.current = controller;
    setActualizando(true);
    try {
      const data = await api<TurnoAfectado[]>(
        `/api/agenda/reprogramaciones-pendientes?profesionalId=${profesionalId}`,
        { signal: controller.signal },
      );
      if (!controller.signal.aborted) {
        setPendientes(data);
        setError("");
      }
    } catch (e) {
      // Un fallo temporal conserva el último resultado conocido y se informa en la pantalla.
      if (!abortado(e) && !controller.signal.aborted) setError(detalleError(e));
    } finally {
      if (!controller.signal.aborted) {
        setCargando(false);
        setActualizando(false);
      }
    }
  }, [api, profesionalId, habilitada]);

  useEffect(() => {
    setPendientes([]);
    setError("");
    setCargando(true);
    if (!habilitada || !profesionalId) return;
    void actualizar();
    const alVolver = () => {
      if (document.visibilityState !== "hidden") void actualizar();
    };
    const intervalo = window.setInterval(alVolver, 30_000);
    window.addEventListener("focus", alVolver);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      peticion.current?.abort();
      window.clearInterval(intervalo);
      window.removeEventListener("focus", alVolver);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [actualizar, habilitada, profesionalId]);

  return { pendientes, cargando, actualizando, error, actualizar };
}

export type Reprogramaciones = ReturnType<typeof useReprogramaciones>;
