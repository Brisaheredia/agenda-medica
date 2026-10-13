import type { ReactNode } from "react";
import type { Profesional, Sesion } from "../types";
import { Brand } from "./Brand";
import { Icon } from "./Icon";

export type NavItem = {
  icon: string;
  label: string;
  href?: string;
  active?: boolean;
};
type Props = {
  menu: NavItem[];
  profesional: Profesional | null;
  sesion: Sesion;
  busy: boolean;
  salir: () => void;
  demo: boolean;
  cambiarModo: (value: boolean) => void;
  reiniciarDemo: () => void;
  navigate: (to: string) => void;
  children: ReactNode;
  overlay?: ReactNode;
};

export function AppLayout({
  menu,
  profesional,
  sesion,
  busy,
  salir,
  demo,
  cambiarModo,
  reiniciarDemo,
  navigate,
  children,
  overlay,
}: Props) {
  function manejarNavegacion(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className="app-shell" onClick={manejarNavegacion}>
      <a href="#main" className="skip-link">
        Ir a la agenda
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <div>
            <strong>Agenda Médica</strong>
            <span>Gestión del consultorio</span>
          </div>
        </div>
        <p className="nav-label">OPERACIÓN PRINCIPAL</p>
        <nav aria-label="Navegación principal">
          {menu.map((item) => (
            item.href ? (
              <a
                key={item.label}
                href={`${item.href}${window.location.search}`}
                className={`nav-item ${item.active ? "active" : ""}`}
                aria-current={item.active ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            ) : (
              <button key={item.label} className="nav-item" disabled>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                <small>Pendiente</small>
              </button>
            )
          ))}
        </nav>
        <div className="sidebar-foot">
          <Icon name="audit" />
          <p>
            Un espacio para organizar
            <br />
            la atención de cada día.
          </p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="consultorio">
            <span className="eyebrow">CONSULTORIO</span>
            <strong>
              {profesional
                ? `Dr. ${profesional.nombre} ${profesional.apellido}`
                : "Dr. Salvador Amado"}
            </strong>
          </div>
          <div className="session">
            <span className="avatar">
              {sesion.email.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{sesion.email}</strong>
              <span>
                {
                  {
                    ADMIN: "Administración",
                    RECEPCION: "Recepción",
                    MEDICO: "Médico",
                  }[sesion.rol]
                }
              </span>
            </div>
            <button
              className="icon-button"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              disabled={busy}
              onClick={salir}
            >
              <Icon name="exit" />
            </button>
          </div>
        </header>
        <main id="main" className="content">
          {demo && (
            <section className="demo-banner" aria-label="Modo de demostración">
              <div>
                <strong>Modo de demostración</strong>
                <p>
                  Pacientes y turnos ficticios. Los cambios duran hasta recargar
                  o reiniciar. Empezamos con horarios de mañana.
                </p>
              </div>
              <div className="demo-actions">
                <button
                  className="secondary small"
                  disabled={busy}
                  onClick={reiniciarDemo}
                >
                  <Icon name="refresh" size={15} />
                  Reiniciar ejemplos
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => cambiarModo(false)}
                >
                  Salir de la demostración
                </button>
              </div>
            </section>
          )}
          {demo && (
            <details className="demo-guide">
              <summary>Ideas para probar esta versión</summary>
              <ol>
                <li>
                  Elegí un horario disponible, buscá <strong>Luna</strong> y
                  confirmá un turno para Bruno.
                </li>
                <li>
                  Reprogramá el turno de <strong>Clara Ríos</strong> eligiendo
                  otra fecha y horario.
                </li>
                <li>
                  Cancelá una reserva indicando un motivo y consultá el filtro{" "}
                  <strong>Cancelados</strong>.
                </li>
                <li>
                  Creá un paciente desde <strong>Nuevo paciente</strong> y
                  asignale un horario.
                </li>
                <li>
                  Para registrar atención o ausencia, elegí una fecha pasada y
                  probá con el turno reservado de las 11:00.
                </li>
              </ol>
            </details>
          )}
          {children}
        </main>
      </div>
      {overlay}
    </div>
  );
}
