# Pendientes, defectos y riesgos

Registro de la base `96fc37a`. P1 indica impedimento para dar por cerrado el circuito operativo; P2 consolidación del MVP; P3 mejora posterior. “Inspección” y “riesgo” no equivalen a reproducción E2E. No se asignan responsables ni fechas ficticias: el equipo debe completarlos al planificar.

| ID | Prioridad y evidencia | Situación y cierre verificable |
|---|---|---|
| INC-01 | P1, condición reproducida en Java | Generación y apertura usan LocalTime.plusMinutes en while; cerca de medianoche puede volver a 00:00 y no terminar. Cerrar con iteración finita y CA-14. |
| INC-02 | P1, inspección | Unicidad sólo por inicio permite franjas superpuestas del mismo profesional. Impedir intervalos incompatibles también ante concurrencia; CA-07. |
| INC-03 | P1, inspección | Cancelar/reprogramar libera origen dentro de cierre sin revalidarlo. Aplicar disponibilidad efectiva; CA-08/09. |
| INC-04 | P1 para aceptación solicitada, inspección | Cierre devuelve IDs, sin pacientes/contacto ni consulta recuperable. Completar RF-17 y CA-10. |
| INC-05 | P2, riesgo por intercalación de operaciones | Turno sin versionado/bloqueo común; cambios concurrentes pueden divergir y bloqueos cruzados pueden producir interbloqueo. Cerrar con estrategia y CA-18. |
| INC-06 | P2, inspección | Semanal usa configuración guardada, pero backend acepta otra duración y apertura UI sigue en 30; seed crea 30. Alinear nuevas operaciones y preservar historia; CA-17. |
| INC-07 | P2, inspección | Búsqueda de Pacientes depende de query y recarga lista sin filtro al escribir. Definir búsqueda explícita o con demora y validar CA-05. |
| INC-08 | P2, inspección | No hay edición/listado/reemplazo integral de reglas; crear nuevas vigencias puede dejar reglas previas aplicables. Completar administración sin destruir compromisos. |
| INC-09 | P2, inspección y 403 reproducido | Errores de parámetros/seguridad no uniformes; sesión inválida y errores técnicos pueden confundirse con permisos. Homogeneizar 400/401/403 y CA-12. |
| INC-10 | P2, inspección | TurnoEvento no asigna usuario aunque exista campo; motivo de reprogramación opcional. Resolver RN-09 y prueba de actor; CA-09. |
| INC-11 | P2, inspección | API disponibles acepta desde pasado y no hasta; UI muestra sólo el primero. Completar alternativas/rango y CA-13. |
| INC-12 | P2, inspección | Reprogramar permite turno original pasado si sigue activo. Definir y aplicar excepción administrativa del SRS. |
| INC-13 | P2, ejecución no completada | Suite no autocontenida para JWT y última tentativa bloqueada por Docker; ejecutar con entorno compatible y conservar resultados. |
| INC-14 | P2 antes de despliegue, inspección | CORS abierto, ddl-auto update y falta de migraciones/operación productiva. Aplicar configuración y CA-15. |
| INC-15 | P3, inspección | Pacientes sin query carga todos y limita en memoria; apertura consulta franjas en cada iteración; semana hace 7/14 GET. Medir y optimizar consultas según RNF. |

## Correcciones ya incorporadas

- `c93ccc0`: duración inicial de configuración pasó a 40; no migra registros existentes.
- `6999346`: calendario incluye profesionalId; selección múltiple de días y duración semanal desde configuración guardada; pasos y recarga tras generación.
- `96fc37a`: fecha seleccionada al centro, Hoy sólo si corresponde y fechas adyacentes.

La corrección del parámetro evita el 403 observado en ese calendario; no corrige todo el tratamiento HTTP del backend. La selección múltiple tampoco crea una transacción común de varios días.

## Decisiones de alcance pendientes

Validar permisos de médico/recepción frente al SRS, momento de previsualización de afectados y obligatoriedad del motivo de reprogramación. Definir responsable técnico, respaldo, retención y recuperación. No expandir automáticamente a recordatorios, sincronización de feriados, reportes o portal paciente: requieren acuerdo específico.

## Orden de implementación

Corregir INC-01/02/03 y completar INC-04; después cerrar concurrencia, duración, permisos y pruebas reproducibles. Mantener mejoras de uso pequeñas cuando no comprometan esas reglas. Los cambios de esquema requieren un plan de datos previo. Relacionar cada cierre con el caso de [aceptación](pruebas-aceptacion.md), código y evidencia, y actualizar este registro.
