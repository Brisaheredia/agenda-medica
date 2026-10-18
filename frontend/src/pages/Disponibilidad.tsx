import { useEffect, useState } from "react";
import { detalleError } from "../api";
import { hoy } from "../types";
import { CalendarioSemanalDisponibilidad } from "../components/CalendarioSemanalDisponibilidad";
import { Icon } from "../components/Icon";
import { GeneracionMensual } from "../components/GeneracionMensual";

type Props = {
  profesionalId: number | undefined;
  puedeGestionarHorarios: boolean;
  puedeConfigurar: boolean;
  verContactos: boolean;
  busy: boolean;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
};

type ConfiguracionAgenda = {
  duracionEstandarMin: number;
  horizonteReservaDias: number;
};

const diasSemana = [
  ["MONDAY", "Lunes"],
  ["TUESDAY", "Martes"],
  ["WEDNESDAY", "Miércoles"],
  ["THURSDAY", "Jueves"],
  ["FRIDAY", "Viernes"],
  ["SATURDAY", "Sábado"],
  ["SUNDAY", "Domingo"],
];
const diasLaborables = diasSemana.slice(0, 5).map(([dia]) => dia);

export function DisponibilidadPage({
  profesionalId,
  puedeGestionarHorarios,
  puedeConfigurar,
  verContactos,
  busy,
  api,
}: Props) {
  const [diasSeleccionados, setDiasSeleccionados] = useState(diasLaborables);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("20:00");
  const [configuracion, setConfiguracion] = useState<ConfiguracionAgenda | null>(null);
  const [horizonteDias, setHorizonteDias] = useState(90);
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);
  const [vigenciaDesde, setVigenciaDesde] = useState(hoy());
  const [vigenciaHasta, setVigenciaHasta] = useState("");
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [revisionCalendario, setRevisionCalendario] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const operando = busy || guardandoConfiguracion || guardandoPlantilla || generando;
  useEffect(() => {
    const controller = new AbortController();
    api<ConfiguracionAgenda>(
      "/api/configuracion/agenda",
      { signal: controller.signal },
    )
      .then((config) => {
        setConfiguracion(config);
        setHorizonteDias(config.horizonteReservaDias);
      })
      .catch((e) => {
        if (e instanceof Error && e.name !== "AbortError")
          setError(detalleError(e));
      });
    return () => controller.abort();
  }, [api]);

  async function guardarConfiguracion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!puedeConfigurar || operando || !configuracion) return;
    setGuardandoConfiguracion(true);
    setError("");
    setMensaje("");
    try {
      const guardada = await api<ConfiguracionAgenda>("/api/configuracion/agenda", {
        method: "PUT",
        body: JSON.stringify({
          horizonteReservaDias: horizonteDias,
        }),
      });
      setConfiguracion(guardada);
      setHorizonteDias(guardada.horizonteReservaDias);
      setMensaje("Configuración de agenda guardada.");
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setGuardandoConfiguracion(false);
    }
  }
  async function guardarPlantilla(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!puedeGestionarHorarios || !profesionalId || operando || !configuracion || !diasSeleccionados.length) return;
    if (horaFin <= horaInicio) {
      setError("El horario de fin debe ser posterior al de inicio.");
      return;
    }
    setGuardandoPlantilla(true);
    setMensaje("");
    setError("");
    const guardados: string[] = [];
    const elegidos = diasSemana.filter(([dia]) => diasSeleccionados.includes(dia));
    try {
      for (const [diaSemana] of elegidos) {
        await api("/api/agenda/plantillas", {
          method: "POST",
          body: JSON.stringify({
            profesionalId,
            diaSemana,
            horaInicio,
            horaFin,
            vigenciaDesde,
            vigenciaHasta: vigenciaHasta || null,
          }),
        });
        guardados.push(diaSemana);
      }
      setMensaje(
        `Horario guardado para ${elegidos.map(([, nombre]) => nombre.toLocaleLowerCase("es-AR")).join(", ")}, de ${horaInicio} a ${horaFin}. Ahora elegí las fechas y habilitá los horarios para reservar.`,
      );
    } catch (e) {
      setDiasSeleccionados((dias) => dias.filter((dia) => !guardados.includes(dia)));
      const resumen = guardados.length
        ? `Se guardaron ${guardados.length} días. Quedaron seleccionados solamente los pendientes para volver a intentar. `
        : "No se guardó ningún día. ";
      setError(resumen + detalleError(e));
    } finally {
      setGuardandoPlantilla(false);
    }
  }


  return (
    <section aria-labelledby="availability-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONFIGURACIÓN DEL CONSULTORIO</p>
          <h1 id="availability-title">Disponibilidad</h1>
          <p className="muted">
            {puedeGestionarHorarios ? "Definí horarios semanales y generá las franjas que se podrán reservar." : "Consultá los horarios de atención y la disponibilidad del consultorio."}
          </p>
        </div>
        <a className="secondary small" href={`/${window.location.search}`}>
          Volver a la agenda
        </a>
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="alert success" role="status">
          {mensaje}
        </div>
      )}

      <CalendarioSemanalDisponibilidad
        profesionalId={profesionalId}
        api={api}
        revision={revisionCalendario}
        verContactos={verContactos}
      />

      {puedeConfigurar && <form
        className="card agenda-settings-form"
        onSubmit={guardarConfiguracion}
      >
        <div className="panel-heading">
          <div>
            <h2>Configuración de agenda</h2>
            <p>
              Definí con cuánta anticipación se pueden reservar turnos.
            </p>
          </div>
          <Icon name="clock" />
        </div>
        <fieldset disabled={operando || !configuracion}>
          <div className="availability-fields">
            <p className="booking-note">Todos los turnos duran 40 minutos. La duración es fija.</p>
            <label>
              Anticipación máxima para reservar (días)
              <input
                type="number"
                min="1"
                max="365"
                required
                value={horizonteDias}
                onChange={(e) => setHorizonteDias(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            className="primary"
            disabled={operando || !configuracion}
          >
            {guardandoConfiguracion ? "Guardando…" : "Guardar configuración"}
          </button>
        </fieldset>
      </form>}

      {puedeGestionarHorarios && <div className="availability-forms">
        <form className="card availability-form" onSubmit={guardarPlantilla}>
          <div className="panel-heading">
            <div>
              <h2>1. Días y horario de atención</h2>
              <p>Elegí los días que comparten el mismo horario y guardalos juntos.</p>
            </div>
            <Icon name="clock" />
          </div>
          <fieldset
            disabled={operando || !profesionalId || !configuracion}
          >
            <div className="availability-day-selection" role="group" aria-labelledby="attention-days-label">
              <span id="attention-days-label" className="availability-field-label">Días de atención</span>
              <div className="availability-day-presets">
                <button type="button" className="secondary small" onClick={() => setDiasSeleccionados([...diasLaborables])}>
                  Lunes a viernes
                </button>
                <button type="button" className="text-button" onClick={() => setDiasSeleccionados(diasSemana.map(([dia]) => dia))}>
                  Toda la semana
                </button>
                <button type="button" className="text-button" onClick={() => setDiasSeleccionados([])}>
                  Limpiar
                </button>
              </div>
              <div className="availability-day-options">
                {diasSemana.map(([dia, nombre]) => (
                  <label key={dia} className="availability-day-option">
                    <input
                      type="checkbox"
                      checked={diasSeleccionados.includes(dia)}
                      onChange={(event) => setDiasSeleccionados((dias) =>
                        event.target.checked ? [...dias, dia] : dias.filter((elegido) => elegido !== dia),
                      )}
                    />
                    {nombre}
                  </label>
                ))}
              </div>
              {!diasSeleccionados.length && <p className="muted">Seleccioná al menos un día para guardar el horario.</p>}
            </div>
            <div className="availability-fields">
              <label>
                Desde
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </label>
              <label>
                Hasta
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </label>
            </div>
            <p className="booking-note">
              {configuracion
                ? "Cada turno dura 40 minutos. Esta duración no se puede modificar."
                : "Cargando la duración de los turnos…"}
            </p>
            <div className="availability-fields">
              <label>
                Vigente desde
                <input
                  type="date"
                  required
                  value={vigenciaDesde}
                  onChange={(e) => setVigenciaDesde(e.target.value)}
                />
              </label>
              <label>
                Vigente hasta <span className="optional">(opcional)</span>
                <input
                  type="date"
                  min={vigenciaDesde}
                  value={vigenciaHasta}
                  onChange={(e) => setVigenciaHasta(e.target.value)}
                />
              </label>
            </div>
            <button className="primary" disabled={!profesionalId || !diasSeleccionados.length}>
              {guardandoPlantilla ? "Guardando…" : `Guardar horario para ${diasSeleccionados.length} ${diasSeleccionados.length === 1 ? "día" : "días"}`}
            </button>
          </fieldset>
        </form>

        {configuracion && <GeneracionMensual
          key={`${configuracion.duracionEstandarMin}/${configuracion.horizonteReservaDias}/${profesionalId}`}
          api={api}
          profesionalId={profesionalId}
          horizonteDias={configuracion.horizonteReservaDias}
          habilitada={!!profesionalId && !busy && !guardandoConfiguracion && !guardandoPlantilla}
          onBusyChange={setGenerando}
          onConfirmado={() => setRevisionCalendario((revision) => revision + 1)}
        />}
      </div>}
    </section>
  );
}
