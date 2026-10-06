# Arquitectura

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Spring Boot 3 + Java 21
- Persistencia: MySQL 8
- ORM: Spring Data JPA / Hibernate
- Seguridad: Spring Security; JWT pendiente
- API: REST + OpenAPI/Swagger

## Núcleo implementado

```text
Paciente
   |
   v
Turno ----> TurnoEvento
   |              |
   v              v
Franja         Auditoria
   ^
   |
PlantillaDisponibilidad
   ^
   |
ExcepcionAgenda
```

Las franjas se materializan en MySQL. Una plantilla recurrente genera slots futuros y el proceso es idempotente.

## Reserva, cancelación y reprogramación

La reserva usa `PESSIMISTIC_WRITE` y valida disponibilidad dentro de la transacción. La cancelación libera la franja. La reprogramación libera la anterior, ocupa la nueva y registra ambas en `TurnoEvento`.

## Excepciones

Un `CIERRE` bloquea solamente franjas libres y conserva los turnos activos, devolviendo sus IDs para tratamiento manual. Una `APERTURA` puede crear franjas excepcionales o reabrir franjas bloqueadas.

## Estados finales

`ATENDIDO` y `AUSENTE` sólo se permiten desde la hora de inicio del turno. Ambas operaciones generan evento y auditoría.

## Auditoría

Las operaciones críticas crean registros en `Auditoria`. Mientras no exista JWT, `usuario_id` permanece nulo; al incorporar autenticación el mismo servicio podrá asociar el usuario autenticado.

## Seguridad

La API continúa abierta sólo durante desarrollo. Antes del cierre del MVP se deben implementar autenticación JWT y autorización por roles `ADMIN`, `RECEPCION` y `MEDICO`.

## CI

GitHub Actions compila el backend con Java 21/Maven y ejecuta el build del frontend con Node 20.
