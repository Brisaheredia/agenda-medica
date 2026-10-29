import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, abortado, crearApi, detalleError } from "./api";
import type { Profesional, Sesion, Turno } from "./types";
import { fechaLarga, hoy, moverDia } from "./types";
import { TurnoDialog } from "./components/TurnoDialog";
import type { Accion } from "./components/TurnoDialog";
import { AgendaPage } from "./pages/Agenda";
import { DisponibilidadPage } from "./pages/Disponibilidad";
import { PacientesPage } from "./pages/Pacientes";
import { BloqueosPage } from "./pages/Bloqueos";
import { AuditoriaPage } from "./pages/Auditoria";
import { ReprogramacionesPage } from "./pages/Reprogramaciones";
import { UsuariosPage } from "./pages/Usuarios";
import { permisosDe, roles } from "./permisos";
import { LoginPage } from "./pages/Login";
import { useAgenda } from "./hooks/useAgenda";
import { usePathname } from "./hooks/usePathname";
import { useReprogramaciones } from "./hooks/useReprogramaciones";
import { AppLayout } from "./components/AppLayout";
import type { NavItem } from "./components/AppLayout";
import "./styles.css";

export default function App() {
  const { pathname: ruta, navigate } = usePathname();
  const [sesion, setSesion] = useState<Sesion | null>(() => {
    try {
      const s = JSON.parse(localStorage.getItem("agendaSesion") ?? "null");
      return s?.token &&
        s?.email &&
        roles.includes(s?.rol)
        ? s
        : null;
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "error" | "success";
    texto: string;
  } | null>(null);
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [intentoProfesional, setIntentoProfesional] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{ turno: Turno; tipo: Accion } | null>(
    null,
  );
  const mutation = useRef(false);
  const salir = useCallback(() => {
    localStorage.removeItem("agendaSesion");
    setSesion(null);
    setProfesional(null);
    setDialog(null);
    setMensaje(null);
  }, []);
  const api = useMemo(() => crearApi(sesion, salir), [sesion, salir]);
  const agenda = useAgenda({
    api,
    habilitada: ruta === "/",
    sesionActiva: !!sesion,
    profesional,
  });
  const {
    fecha,
    setFecha,
    franjas,
    turnos,
    excepciones,
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
  } = agenda;
  const permisos = permisosDe(sesion?.rol);
  const gestionar = permisos.gestionarTurnos;
  const cerrar = permisos.registrarResultados;
  const reprogramaciones = useReprogramaciones({
    api, profesionalId: profesional?.id, habilitada: !!sesion && permisos.verContactos,
  });

  useEffect(() => {
    if (!sesion) return;
    const controller = new AbortController();
    api<Profesional[]>("/api/profesionales", { signal: controller.signal })
      .then((data) => {
        const p = data.find((p) => p.activo);
        if (!p)
          throw new Error(
            "No hay un profesional activo configurado para la agenda.",
          );
        setProfesional(p);
      })
      .catch((e) => {
        if (!abortado(e)) setErrorAgenda(detalleError(e));
      });
    return () => controller.abort();
  }, [api, sesion, intentoProfesional]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (loginBusy) return;
    setLoginBusy(true);
    setMensaje(null);
    setErrorAgenda("");
    try {
      const data = await api<Sesion>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      localStorage.setItem("agendaSesion", JSON.stringify(data));
      setSesion(data);
      setPassword("");
    } catch (e) {
      setMensaje({ tipo: "error", texto: detalleError(e) });
    } finally {
      setLoginBusy(false);
    }
  }

  async function guardar(path: string, body?: object): Promise<boolean> {
    if (mutation.current || !ready) return false;
    mutation.current = true;
    setBusy(true);
    setMensaje(null);
    try {
      await api(path, {
        method: "POST",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMensaje({
        tipo: "success",
        texto:
          path === "/api/turnos"
            ? "Turno reservado correctamente."
            : "El cambio se guardó correctamente.",
      });
      setRevision((n) => n + 1);
      setSelected(null);
      await reprogramaciones.actualizar();
      return true;
    } catch (e) {
      const conflicto = e instanceof ApiError && e.status === 409;
      setMensaje({
        tipo: "error",
        texto: conflicto
          ? `No se guardó el cambio: ${detalleError(e)}. La agenda se actualizará para que puedas elegir otro horario.`
          : detalleError(e),
      });
      if (conflicto) {
        setRevision((n) => n + 1);
        setSelected(null);
      }
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  function cambiarFecha(value: string) {
    if (value && !busy) {
      setFecha(value);
      setSelected(null);
      setFiltro("TODOS");
      setMensaje(null);
    }
  }

  if (!sesion)
    return (
      <LoginPage
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        busy={loginBusy}
        mensaje={mensaje}
        ingresar={login}
      />
    );

  const disponibilidad = ruta === "/disponibilidad";
  const pacientesPage = ruta === "/pacientes";
  const bloqueosPage = ruta === "/bloqueos";
  const auditoriaPage = ruta === "/auditoria";
  const reprogramacionesPage = ruta === "/reprogramaciones";
  const usuariosPage = ruta === "/usuarios";
  const menu: NavItem[] = [
    { icon: "calendar", label: "Agenda", href: "/", active: ruta === "/" },
    {
      icon: "people",
      label: "Pacientes",
      href: "/pacientes",
      active: pacientesPage,
    },
    {
      icon: "clock",
      label: "Disponibilidad",
      href: "/disponibilidad",
      active: disponibilidad,
    },
    {
      icon: "block",
      label: "Bloqueos y excepciones",
      href: "/bloqueos",
      active: bloqueosPage,
    },
    {
      icon: "audit",
      label: "Auditoria",
      href: "/auditoria",
      active: auditoriaPage,
    },
    { icon: "calendar", label: "Reprogramaciones", href: "/reprogramaciones", active: reprogramacionesPage,
      pendientes: reprogramaciones.pendientes.length },
    { icon: "people", label: "Usuarios", href: "/usuarios", active: usuariosPage },
  ];
  const puedeVerRuta = (href: string | undefined) => {
    if (href === "/usuarios" || href === "/auditoria") return permisos.administrar;
    if (href === "/bloqueos") return permisos.gestionarHorarios;
    if (href === "/pacientes" || href === "/reprogramaciones") return permisos.verContactos;
    return true;
  };
  const pageContent = !puedeVerRuta(ruta) ? (
    <section className="card"><h1>Acceso restringido</h1><p>Tu cuenta no tiene permiso para acceder a esta sección.</p><a href="/">Volver a la agenda</a></section>
  ) : usuariosPage ? (
    <UsuariosPage api={api} emailActual={sesion.email} salir={salir} />
  ) : reprogramacionesPage ? (
    <ReprogramacionesPage api={api} puedeGestionar={gestionar} datos={reprogramaciones} />
  ) : bloqueosPage ? (
    <BloqueosPage
      api={api}
      profesionalId={profesional?.id}
      puedeGestionar={permisos.gestionarHorarios}
      onGuardado={reprogramaciones.actualizar}
    />
  ) : auditoriaPage ? (
    <AuditoriaPage api={api} esAdmin={sesion.rol === "ADMIN"} />
  ) : pacientesPage ? (
    <PacientesPage
      api={api}
      puedeGestionar={permisos.gestionarPacientes}
    />
  ) : disponibilidad ? (
    <DisponibilidadPage
      profesionalId={profesional?.id}
      puedeGestionarHorarios={permisos.gestionarHorarios}
      verContactos={permisos.verContactos}
      busy={busy}
      api={api}
    />
  ) : (
    <AgendaPage
      busy={busy}
      mensaje={mensaje}
      setMensaje={setMensaje}
      fecha={fecha}
      cambiarFecha={cambiarFecha}
      hoy={hoy}
      moverDia={moverDia}
      fechaLarga={fechaLarga}
      profesional={profesional}
      profesionalId={profesional?.id}
      cargando={cargando}
      errorAgenda={errorAgenda}
      setErrorAgenda={setErrorAgenda}
      setRevision={setRevision}
      setIntentoProfesional={setIntentoProfesional}
      franjas={franjas}
      turnos={turnos}
      excepciones={excepciones}
      ready={ready}
      filtro={filtro}
      setFiltro={setFiltro}
      gestionar={gestionar}
      cerrar={cerrar}
      gestionarPacientes={permisos.gestionarPacientes}
      verContactos={permisos.verContactos}
      selected={selected}
      setSelected={setSelected}
      setDialog={setDialog}
      api={api}
      guardar={guardar}
      irAFranja={irAFranja}
    />
  );
  return (
    <AppLayout
      menu={menu.filter((item) => puedeVerRuta(item.href))}
      profesional={profesional}
      sesion={sesion}
      busy={busy}
      salir={salir}
      navigate={navigate}
      overlay={
        dialog ? (
          <TurnoDialog
            turno={dialog.turno}
            tipo={dialog.tipo}
            api={api}
            busy={busy}
            cancelarPorConsultorio={permisos.cancelarPorConsultorio}
            close={() => setDialog(null)}
            submit={guardar}
          />
        ) : null
      }
    >
      {pageContent}
    </AppLayout>
  );
}
