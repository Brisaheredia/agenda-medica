import { ApiError } from './api'
import type { Api } from './api'
import type { Franja, Paciente, Turno } from './types'
import { activo, hora, hoy, reservable } from './types'

// Separate, transient store: demo requests never reach the server or localStorage.
export function crearDemoApi(): Api {
  const pacientes: Paciente[] = [
    { id: 1, dni: '90000001', nombre: 'Ana', apellido: 'Torres', telefono: '11 0000-0001', activo: true },
    { id: 2, dni: '90000002', nombre: 'Bruno', apellido: 'Luna', telefono: '11 0000-0002', activo: true },
    { id: 3, dni: '90000003', nombre: 'Clara', apellido: 'Ríos', telefono: '11 0000-0003', activo: true },
    { id: 4, dni: '90000004', nombre: 'Diego', apellido: 'Vega', telefono: '11 0000-0004', activo: true },
  ]
  const franjas: Franja[] = []
  const turnos: Turno[] = []
  const dias = new Set<string>()
  let siguienteFranja = 1
  let siguienteTurno = 1
  let siguientePaciente = 5

  function prepararDia(fecha: string) {
    if (dias.has(fecha)) return
    dias.add(fecha)
    const bloques = ['09:00', '09:40', '10:20', '11:00', '11:40', '12:20', '13:00']
    for (let i = 0; i < 6; i++) {
      const franja: Franja = {
        id: siguienteFranja++, profesionalId: 1,
        inicio: `${fecha}T${bloques[i]}:00`, fin: `${fecha}T${bloques[i + 1]}:00`,
        estado: i === 0 || i === 3 ? 'OCUPADA' : i === 4 ? 'BLOQUEADA' : 'LIBRE', origen: 'DEMO',
      }
      franjas.push(franja)
      if (i === 0 || i === 3) {
        const paciente = pacientes[i === 0 ? 0 : 2]
        turnos.push({
          id: siguienteTurno++, pacienteId: paciente.id, paciente: `${paciente.apellido}, ${paciente.nombre}`,
          profesionalId: 1, franjaId: franja.id, inicio: franja.inicio, fin: franja.fin,
          estado: i === 0 && new Date(franja.inicio).getTime() < Date.now() ? 'ATENDIDO' : 'RESERVADO',
          motivoConsulta: i === 0 ? 'Control general · ejemplo' : 'Consulta de seguimiento · ejemplo',
        })
      }
      if (i === 1) turnos.push({
        id: siguienteTurno++, pacienteId: 2, paciente: 'Luna, Bruno', profesionalId: 1, franjaId: franja.id,
        inicio: franja.inicio, fin: franja.fin, estado: 'CANCELADO', motivoConsulta: 'Cancelación de ejemplo; el horario quedó libre.',
      })
    }
  }

  function exigirFranja(id: number): Franja {
    const f = franjas.find(f => f.id === id)
    if (!f) throw new ApiError(404, 'No se encontró ese horario de ejemplo.')
    if (!reservable(f)) throw new ApiError(409, 'La franja ya no está disponible')
    return f
  }

  return async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    await new Promise<void>((resolve, reject) => {
      const signal = options.signal
      if (signal?.aborted) { reject(new DOMException('Solicitud cancelada', 'AbortError')); return }
      const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new DOMException('Solicitud cancelada', 'AbortError')) }
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, 120)
      signal?.addEventListener('abort', abort, { once: true })
    })
    const url = new URL(path, 'https://demo.invalid')
    const method = options.method ?? 'GET'
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {}
    let result: unknown

    if (url.pathname === '/api/profesionales' && method === 'GET') {
      result = [{ id: 1, nombre: 'Salvador', apellido: 'Amado', activo: true }]
    } else if (url.pathname === '/api/pacientes' && method === 'GET') {
      const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const query = normalizar(url.searchParams.get('query') ?? '')
      result = pacientes.filter(p => normalizar(`${p.dni} ${p.nombre} ${p.apellido}`).includes(query))
    } else if (url.pathname === '/api/pacientes' && method === 'POST') {
      if (!body.dni?.trim() || !body.nombre?.trim() || !body.apellido?.trim()) throw new ApiError(400, 'Completá DNI, nombre y apellido.')
      if (pacientes.some(p => p.dni === body.dni.trim())) throw new ApiError(409, 'Ya existe un paciente con ese DNI.')
      const paciente: Paciente = { id: siguientePaciente++, dni: body.dni.trim(), nombre: body.nombre.trim(), apellido: body.apellido.trim(), telefono: body.telefono, email: body.email, activo: true }
      pacientes.push(paciente)
      result = paciente
    } else if ((url.pathname === '/api/agenda' || url.pathname === '/api/turnos') && method === 'GET') {
      const fecha = url.searchParams.get('fecha') ?? hoy()
      prepararDia(fecha)
      result = (url.pathname === '/api/agenda' ? franjas : turnos).filter(item => item.inicio.startsWith(fecha))
    } else if (url.pathname === '/api/turnos' && method === 'POST') {
      const paciente = pacientes.find(p => p.id === body.pacienteId)
      if (!paciente) throw new ApiError(404, 'Seleccioná un paciente de ejemplo.')
      const franja = exigirFranja(body.franjaId)
      const turno: Turno = {
        id: siguienteTurno++, pacienteId: paciente.id, paciente: `${paciente.apellido}, ${paciente.nombre}`,
        profesionalId: 1, franjaId: franja.id, inicio: franja.inicio, fin: franja.fin,
        estado: 'RESERVADO', motivoConsulta: body.motivoConsulta,
      }
      turnos.push(turno)
      franja.estado = 'OCUPADA'
      result = turno
    } else {
      const match = url.pathname.match(/^\/api\/turnos\/(\d+)\/(cancelacion|reprogramacion|atencion|ausencia)$/)
      if (!match || method !== 'POST') throw new ApiError(404, 'Esta operación no está disponible en la demostración.')
      const turno = turnos.find(t => t.id === Number(match[1]))
      if (!turno) throw new ApiError(404, 'No se encontró ese turno de ejemplo.')
      if (!activo(turno)) throw new ApiError(409, 'El turno ya no está activo')
      const anterior = franjas.find(f => f.id === turno.franjaId)!
      if (match[2] === 'cancelacion') {
        if (!body.motivo?.trim()) throw new ApiError(400, 'El motivo es obligatorio.')
        turno.estado = 'CANCELADO'
        anterior.estado = 'LIBRE'
      } else if (match[2] === 'reprogramacion') {
        const destino = exigirFranja(body.franjaId)
        anterior.estado = 'LIBRE'
        destino.estado = 'OCUPADA'
        turno.franjaId = destino.id
        turno.inicio = destino.inicio
        turno.fin = destino.fin
      } else {
        if (new Date(turno.inicio).getTime() > Date.now()) throw new ApiError(400, `Este turno comienza a las ${hora(turno.inicio)}. Todavía no podés registrar el resultado.`)
        turno.estado = match[2] === 'atencion' ? 'ATENDIDO' : 'AUSENTE'
      }
      result = turno
    }
    return structuredClone(result) as T
  }
}
