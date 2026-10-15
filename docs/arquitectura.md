# Arquitectura

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Spring Boot 3 + Java 21
- Persistencia: MySQL 8
- ORM: Spring Data JPA / Hibernate
- Seguridad: Spring Security, JWT y autorización por roles
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

## Configuración de agenda

`ConfiguracionAgenda` mantiene una única configuración persistida con duración estándar (30 minutos por defecto) y horizonte de reserva (90 días por defecto). El horizonte limita tanto la generación de nuevas franjas como la creación y búsqueda de turnos futuros.

## Auditoría

Las operaciones críticas crean registros en `Auditoria`, incluyendo altas, actualizaciones y bajas lógicas de pacientes, configuración de agenda y operaciones de turnos y disponibilidad. El servicio asocia el usuario autenticado cuando hay un JWT válido y evita registrar datos personales del paciente en los metadatos.

## Seguridad

Las rutas protegidas requieren autenticación JWT y autorizan operaciones por los roles `ADMIN`, `RECEPCION` y `MEDICO`. El CORS configurado permite cualquier origen para facilitar desarrollo local; en un despliegue se deben restringir los orígenes al dominio del frontend y servir la API por HTTPS.

## CI

GitHub Actions compila el backend con Java 21/Maven y ejecuta el build del frontend con Node 20.
