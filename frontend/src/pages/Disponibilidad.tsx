import { useState } from "react";
import { CalendarioSemanalDisponibilidad } from "../components/CalendarioSemanalDisponibilidad";
import { Icon } from "../components/Icon";
import { GeneracionMensual } from "../components/GeneracionMensual";

type Props = {
  profesionalId: number | undefined;
  puedeGestionarHorarios: boolean;
  verContactos: boolean;
  busy: boolean;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
};

export function DisponibilidadPage({ profesionalId, puedeGestionarHorarios, verContactos, busy, api }: Props) {
  const [generando, setGenerando] = useState(false);
  const [revisionCalendario, setRevisionCalendario] = useState(0);

  return (
    <section aria-labelledby="availability-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AGENDA DEL CONSULTORIO</p>
          <h1 id="availability-title">Disponibilidad</h1>
          <p className="muted">Consultá el horario habitual y habilitá los turnos del mes.</p>
        </div>
        <a className="secondary small" href={`/${window.location.search}`}>Volver a la agenda</a>
      </div>

      <div className="availability-forms">
          <div className="card availability-form">
            <div className="panel-heading">
              <div>
                <h2>Horario habitual de atención</h2>
                <p>Horario confirmado por el consultorio.</p>
              </div>
              <Icon name="clock" />
            </div>
            <div className="availability-hours-summary">
              <div><span className="muted">Días</span><strong>Lunes a viernes</strong></div>
              <div><span className="muted">Horario</span><strong>08:00 a 20:00</strong></div>
              <div><span className="muted">Cada turno</span><strong>40 minutos</strong></div>
            </div>
            <p className="booking-note">Si el médico suspende una fecha, utilizá Bloqueos y excepciones. Los turnos asignados se conservan para reprogramarlos.</p>
          </div>

          {puedeGestionarHorarios && (
            <GeneracionMensual
              api={api}
              profesionalId={profesionalId}
              habilitada={!!profesionalId && !busy && !generando}
              onBusyChange={setGenerando}
              onConfirmado={() => setRevisionCalendario((revision) => revision + 1)}
            />
          )}
      </div>

      <CalendarioSemanalDisponibilidad
        profesionalId={profesionalId}
        api={api}
        revision={revisionCalendario}
        verContactos={verContactos}
      />
    </section>
  );
}
