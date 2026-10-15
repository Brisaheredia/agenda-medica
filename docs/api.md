# API REST

Base path: `/api`

## Pacientes

- `GET /api/pacientes?query=`
- `GET /api/pacientes/{id}`
- `POST /api/pacientes`
- `PUT /api/pacientes/{id}`
- `DELETE /api/pacientes/{id}` — baja lógica

## Agenda

- `GET /api/agenda?profesionalId={id}&fecha=YYYY-MM-DD`
- `GET /api/agenda/disponibles?profesionalId={id}`
- `GET /api/agenda/disponibles?profesionalId={id}&desde=YYYY-MM-DDTHH:mm:ss`
- `POST /api/agenda/plantillas`
- `POST /api/agenda/generar-franjas`
- `POST /api/agenda/excepciones`
- `POST /api/agenda/bloqueos`
- `GET /api/configuracion/agenda`
- `PUT /api/configuracion/agenda` (solo ADMIN)

La consulta `/disponibles` devuelve franjas `LIBRE` futuras dentro del horizonte configurado. Si `desde` no se informa, usa la fecha y hora actuales.

La configuración devuelve y permite actualizar `duracionEstandarMin` (5 a 240 minutos) y `horizonteReservaDias` (1 a 365 días). Si todavía no hay una fila configurada, se usan los valores iniciales de 30 minutos y 90 días. La configuración afecta las nuevas generaciones y reservas; no modifica turnos ya creados ni plantillas existentes.

Cierre parcial:

```json
{
  "profesionalId": 1,
  "fecha": "2026-10-10",
  "horaInicio": "10:00",
  "horaFin": "12:00",
  "tipo": "CIERRE",
  "motivo": "Reunión"
}
```

Una apertura requiere además `duracionMin`. Un cierre sin horas representa el día completo. Las franjas libres alcanzadas quedan `BLOQUEADA`; los turnos activos no se eliminan y sus IDs se devuelven en `turnosAfectados`.

## Turnos

- `POST /api/turnos`
- `GET /api/turnos/{id}`
- `POST /api/turnos/{id}/cancelacion`
- `POST /api/turnos/{id}/reprogramacion`
- `POST /api/turnos/{id}/atencion`
- `POST /api/turnos/{id}/ausencia`

Los estados `ATENDIDO` y `AUSENTE` sólo pueden registrarse cuando llegó o pasó la hora de inicio.

La creación y la reprogramación bloquean la franja con `PESSIMISTIC_WRITE` y revalidan disponibilidad dentro de la transacción. Si otro usuario tomó la franja, la API responde `409 Conflict`.

## Auditoría

- `GET /api/auditoria` devuelve las últimas 100 operaciones.

Se auditan creación, actualización y desactivación de pacientes; cambios de turnos; plantillas, generación de franjas, excepciones y configuración de agenda. Cuando la operación llega con JWT válido, se asocia el usuario autenticado. El endpoint devuelve los 100 eventos más recientes.

## Errores

- `400 Bad Request`: datos inválidos o regla de negocio no cumplida.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: DNI duplicado, turno no modificable o franja ocupada.

## Seguridad

La API requiere JWT para las rutas protegidas. `ADMIN` gestiona disponibilidad, bloqueos, excepciones, configuración, usuarios y auditoría; `ADMIN` y `RECEPCION` gestionan pacientes y turnos; `ADMIN` y `MEDICO` registran atención y ausencia. El login y la documentación OpenAPI/Swagger son públicos.
