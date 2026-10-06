import { FormEvent, useEffect, useMemo, useState } from 'react'
import './styles.css'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type Rol = 'ADMIN' | 'RECEPCION' | 'MEDICO'
type LoginResponse = { token: string; tokenType: string; expiresInMinutes: number; email: string; rol: Rol }
type Profesional = { id: number; nombre: string; apellido: string; matricula: string; activo: boolean }
type Paciente = { id: number; dni: string; nombre: string; apellido: string; telefono?: string; email?: string; activo: boolean }
type Franja = { id: number; profesionalId: number; inicio: string; fin: string; estado: 'LIBRE' | 'OCUPADA' | 'BLOQUEADA'; origen: string }
type Turno = {
  id: number
  pacienteId: number
  paciente: string
  profesionalId: number
  franjaId: number
  inicio: string
  fin: string
  estado: 'RESERVADO' | 'CONFIRMADO' | 'CANCELADO' | 'ATENDIDO' | 'AUSENTE'
  motivoConsulta?: string
}

function fechaLocalHoy() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function hora(valor: string) {
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(valor))
}

function fechaLarga(valor: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(new Date(valor + 'T12:00:00'))
}

export default function App() {
  const [sesion, setSesion] = useState<LoginResponse | null>(() => {
    const raw = localStorage.getItem('agendaSesion')
    return raw ? JSON.parse(raw) : null
  })
  const [email, setEmail] = useState('admin@agenda.local')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [profesionalId, setProfesionalId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(fechaLocalHoy())
  const [franjas, setFranjas] = useState<Franja[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])

  const [busqueda, setBusqueda] = useState('')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null)
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<Franja | null>(null)
  const [motivo, setMotivo] = useState('')

  const [nuevoPaciente, setNuevoPaciente] = useState({
    dni: '', nombre: '', apellido: '', telefono: '', email: ''
  })

  const token = sesion?.token

  async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {})
      }
    })

    if (response.status === 401 || response.status === 403) {
      if (response.status === 401) cerrarSesion()
      throw new Error(response.status === 401 ? 'Sesión vencida o inválida' : 'No tenés permisos para esta operación')
    }

    if (!response.ok) {
      let detalle = 'Error en la operación'
      try {
        const body = await response.json()
        detalle = body.message ?? body.error ?? detalle
      } catch {
        // sin body JSON
      }
      throw new Error(detalle)
    }

    if (response.status === 204) return undefined as T
    return response.json()
  }

  async function login(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setMensaje('')
    try {
      const response = await fetch(API + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!response.ok) throw new Error('Email o contraseña incorrectos')
      const data: LoginResponse = await response.json()
      localStorage.setItem('agendaSesion', JSON.stringify(data))
      setSesion(data)
      setPassword('')
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('agendaSesion')
    setSesion(null)
    setProfesionales([])
    setTurnos([])
    setFranjas([])
  }

  async function cargarProfesionales() {
    const data = await api<Profesional[]>('/api/profesionales')
    setProfesionales(data)
    if (!profesionalId && data.length) setProfesionalId(data[0].id)
  }

  async function cargarAgenda() {
    if (!profesionalId) return
    setCargando(true)
    setMensaje('')
    try {
      const [franjasDia, turnosDia] = await Promise.all([
        api<Franja[]>(`/api/agenda?profesionalId=${profesionalId}&fecha=${fecha}`),
        api<Turno[]>(`/api/turnos?profesionalId=${profesionalId}&fecha=${fecha}`)
      ])
      setFranjas(franjasDia)
      setTurnos(turnosDia)
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo cargar la agenda')
    } finally {
      setCargando(false)
    }
  }

  async function buscarPacientes() {
    try {
      const data = await api<Paciente[]>(`/api/pacientes?query=${encodeURIComponent(busqueda)}`)
      setPacientes(data)
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudieron buscar pacientes')
    }
  }

  async function crearPaciente(e: FormEvent) {
    e.preventDefault()
    try {
      const creado = await api<Paciente>('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(nuevoPaciente)
      })
      setPacienteSeleccionado(creado)
      setPacientes([creado])
      setBusqueda(creado.dni)
      setNuevoPaciente({ dni: '', nombre: '', apellido: '', telefono: '', email: '' })
      setMensaje('Paciente creado y seleccionado')
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo crear el paciente')
    }
  }

  async function reservar() {
    if (!pacienteSeleccionado || !franjaSeleccionada) return
    try {
      await api<Turno>('/api/turnos', {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: pacienteSeleccionado.id,
          franjaId: franjaSeleccionada.id,
          motivoConsulta: motivo
        })
      })
      setFranjaSeleccionada(null)
      setPacienteSeleccionado(null)
      setMotivo('')
      setMensaje('Turno reservado correctamente')
      await cargarAgenda()
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo reservar el turno')
    }
  }

  async function cancelar(turno: Turno) {
    const motivoCancelacion = window.prompt('Motivo de la cancelación:')
    if (!motivoCancelacion) return
    try {
      await api<Turno>(`/api/turnos/${turno.id}/cancelacion`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivoCancelacion })
      })
      setMensaje('Turno cancelado')
      await cargarAgenda()
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo cancelar')
    }
  }

  async function reprogramar(turno: Turno, nuevaFranjaId: number) {
    if (!nuevaFranjaId) return
    try {
      await api<Turno>(`/api/turnos/${turno.id}/reprogramacion`, {
        method: 'POST',
        body: JSON.stringify({ franjaId: nuevaFranjaId, motivo: 'Reprogramación desde agenda' })
      })
      setMensaje('Turno reprogramado')
      await cargarAgenda()
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo reprogramar')
    }
  }

  async function cerrarTurno(turno: Turno, accion: 'atencion' | 'ausencia') {
    try {
      await api<Turno>(`/api/turnos/${turno.id}/${accion}`, { method: 'POST' })
      setMensaje(accion === 'atencion' ? 'Turno marcado como atendido' : 'Turno marcado como ausente')
      await cargarAgenda()
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo cambiar el estado')
    }
  }

  useEffect(() => {
    if (sesion) cargarProfesionales().catch(e => setMensaje(e.message))
  }, [sesion])

  useEffect(() => {
    if (sesion && profesionalId) cargarAgenda()
  }, [sesion, profesionalId, fecha])

  const libres = useMemo(() => franjas.filter(f => f.estado === 'LIBRE'), [franjas])
  const activos = useMemo(() => turnos.filter(t => t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO'), [turnos])
  const puedeGestionar = sesion?.rol === 'ADMIN' || sesion?.rol === 'RECEPCION'
  const puedeCerrar = sesion?.rol === 'ADMIN' || sesion?.rol === 'MEDICO'

  if (!sesion) {
    return (
      <div className="login-shell">
        <section className="login-card">
          <div className="brand-mark">AM</div>
          <p className="eyebrow">Consultorio</p>
          <h1>Agenda Médica</h1>
          <p className="muted">Ingresá para administrar pacientes, horarios y turnos.</p>
          <form onSubmit={login} className="stack">
            <label>Email
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label>Contraseña
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
            </label>
            <button className="primary" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
          </form>
          {mensaje && <div className="alert">{mensaje}</div>}
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Agenda Médica</p>
          <h1>Panel de turnos</h1>
        </div>
        <div className="session">
          <div>
            <strong>{sesion.email}</strong>
            <span>{sesion.rol}</span>
          </div>
          <button className="ghost" onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <main className="content">
        {mensaje && <div className="notice" onClick={() => setMensaje('')}>{mensaje}</div>}

        <section className="toolbar card">
          <label>Profesional
            <select value={profesionalId ?? ''} onChange={e => setProfesionalId(Number(e.target.value))}>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} · {p.matricula}</option>
              ))}
            </select>
          </label>
          <label>Fecha
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </label>
          <div className="date-title">
            <span>Agenda del día</span>
            <strong>{fechaLarga(fecha)}</strong>
          </div>
        </section>

        <section className="metrics">
          <article className="metric card"><span>Turnos activos</span><strong>{activos.length}</strong></article>
          <article className="metric card"><span>Franjas libres</span><strong>{libres.length}</strong></article>
          <article className="metric card"><span>Total del día</span><strong>{turnos.length}</strong></article>
        </section>

        <div className="grid">
          <section className="card panel">
            <div className="panel-title">
              <div><p className="eyebrow">Agenda</p><h2>Turnos del día</h2></div>
              <button className="ghost" onClick={cargarAgenda}>Actualizar</button>
            </div>

            <div className="turnos-list">
              {turnos.length === 0 && <p className="empty">Todavía no hay turnos para este día.</p>}
              {turnos.map(turno => (
                <article className="turno" key={turno.id}>
                  <div className="time">{hora(turno.inicio)}</div>
                  <div className="turno-main">
                    <strong>{turno.paciente}</strong>
                    <span>{turno.motivoConsulta || 'Sin motivo informado'}</span>
                  </div>
                  <span className={`badge estado-${turno.estado.toLowerCase()}`}>{turno.estado}</span>
                  {(turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO') && (
                    <div className="actions">
                      {puedeGestionar && (
                        <>
                          <select defaultValue="" onChange={e => reprogramar(turno, Number(e.target.value))}>
                            <option value="">Reprogramar…</option>
                            {libres.map(f => <option value={f.id} key={f.id}>{hora(f.inicio)}</option>)}
                          </select>
                          <button className="danger-link" onClick={() => cancelar(turno)}>Cancelar</button>
                        </>
                      )}
                      {puedeCerrar && new Date(turno.inicio) <= new Date() && (
                        <>
                          <button className="success-link" onClick={() => cerrarTurno(turno, 'atencion')}>Atendido</button>
                          <button className="ghost" onClick={() => cerrarTurno(turno, 'ausencia')}>Ausente</button>
                        </>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="side-stack">
            {puedeGestionar && (
              <section className="card panel">
                <div className="panel-title">
                  <div><p className="eyebrow">Nuevo turno</p><h2>Reservar horario</h2></div>
                </div>

                <label>Buscar paciente
                  <div className="inline">
                    <input
                      placeholder="DNI o apellido"
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && buscarPacientes()}
                    />
                    <button className="secondary" onClick={buscarPacientes}>Buscar</button>
                  </div>
                </label>

                {pacientes.length > 0 && (
                  <div className="patient-results">
                    {pacientes.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        className={pacienteSeleccionado?.id === p.id ? 'patient selected' : 'patient'}
                        onClick={() => setPacienteSeleccionado(p)}
                      >
                        <strong>{p.apellido}, {p.nombre}</strong>
                        <span>DNI {p.dni}</span>
                      </button>
                    ))}
                  </div>
                )}

                <label>Horario libre
                  <select
                    value={franjaSeleccionada?.id ?? ''}
                    onChange={e => setFranjaSeleccionada(libres.find(f => f.id === Number(e.target.value)) ?? null)}
                  >
                    <option value="">Seleccionar horario…</option>
                    {libres.map(f => <option key={f.id} value={f.id}>{hora(f.inicio)} – {hora(f.fin)}</option>)}
                  </select>
                </label>

                <label>Motivo
                  <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Control, consulta, seguimiento…" />
                </label>

                <button
                  className="primary"
                  disabled={!pacienteSeleccionado || !franjaSeleccionada}
                  onClick={reservar}
                >
                  Confirmar turno
                </button>
              </section>
            )}

            {puedeGestionar && (
              <details className="card panel">
                <summary>Crear paciente nuevo</summary>
                <form className="stack compact" onSubmit={crearPaciente}>
                  <div className="two-cols">
                    <label>DNI<input required value={nuevoPaciente.dni} onChange={e => setNuevoPaciente({ ...nuevoPaciente, dni: e.target.value })} /></label>
                    <label>Nombre<input required value={nuevoPaciente.nombre} onChange={e => setNuevoPaciente({ ...nuevoPaciente, nombre: e.target.value })} /></label>
                  </div>
                  <label>Apellido<input required value={nuevoPaciente.apellido} onChange={e => setNuevoPaciente({ ...nuevoPaciente, apellido: e.target.value })} /></label>
                  <label>Teléfono<input value={nuevoPaciente.telefono} onChange={e => setNuevoPaciente({ ...nuevoPaciente, telefono: e.target.value })} /></label>
                  <label>Email<input type="email" value={nuevoPaciente.email} onChange={e => setNuevoPaciente({ ...nuevoPaciente, email: e.target.value })} /></label>
                  <button className="secondary">Guardar paciente</button>
                </form>
              </details>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
