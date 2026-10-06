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

La consulta `/disponibles` devuelve únicamente franjas `LIBRE` futuras del profesional. Si `desde` no se informa, usa la fecha y hora actuales.

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

Actualmente se auditan creación/cancelación/reprogramación de turnos, atención/ausencia, creación de plantillas, generación de franjas y excepciones de agenda. El usuario queda nulo hasta incorporar autenticación JWT.

## Errores

- `400 Bad Request`: datos inválidos o regla de negocio no cumplida.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: DNI duplicado, turno no modificable o franja ocupada.

## Seguridad

Spring Security está incorporado, pero los endpoints permanecen temporalmente abiertos para desarrollo. JWT y roles se implementarán antes de cerrar el MVP.
