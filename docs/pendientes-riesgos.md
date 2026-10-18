# Pendientes, defectos y riesgos

Registro actualizado el 17 de octubre de 2026. P1 indica impedimento para dar por cerrado el circuito operativo; P2 consolidación del MVP; P3 mejora posterior. “Inspección” y “riesgo” no equivalen a reproducción E2E. No se asignan responsables ni fechas ficticias: el equipo debe completarlos al planificar.

| ID | Prioridad y evidencia | Situación y cierre verificable |
|---|---|---|
| INC-01 | Corregido en código y prueba de límite mensual | Generación/apertura iteran con LocalDateTime y límite de fin. Se comprueba 23:00–23:59 sin desbordar ni continuar indefinidamente; CA-14 ampliado. |
| INC-02 | Corregido para escrituras de aplicación, integración MySQL | Generación/apertura rechazan superposición; generación limpia sólo libres antiguas sin historial. Reserva valida por intervalo con bloqueo por profesional, incluso entre IDs diferentes. No se requiere migración mensual; los compromisos e historia previos se conservan. |
| INC-03 | Corregido, pruebas unitarias e integración MySQL | DisponibilidadService conserva bloqueo al cancelar/reprogramar y rechaza destinos cerrados; CA-08/09 con validación UI pendiente. |
| INC-04 | Implementado, integración MySQL aprobada | Reprogramaciones recupera turnos/contactos/motivo y permite resolver individualmente, excluyendo cancelaciones del paciente. CA-10 visual pendiente. |
| INC-05 | Parcial, prueba concurrente aprobada | Turno con bloqueo común y franjas ordenadas por ID. Dos reprogramaciones del mismo turno no dejan franjas huérfanas en test. Falta intercalar cierres/generación y otras combinaciones; CA-18. |
| INC-06 | Corregido en código, integración mensual | Duración fija de 40 en backend y frontend; rechaza otros valores. El seed ya no genera franjas. Las citas antiguas conservan su tiempo, pero franjas de otra duración no admiten nuevas reservas; CA-17. |
| INC-07 | P2, inspección | Búsqueda de Pacientes depende de query y recarga lista sin filtro al escribir. Definir búsqueda explícita o con demora y validar CA-05. |
| INC-08 | P2, inspección | No hay edición/listado/reemplazo integral de reglas; la planificación mensual selecciona la última regla vigente por día, pero no hay pantalla de edición/listado de reglas. Completar administración sin destruir compromisos. |
| INC-09 | Corregido en permisos y parámetros HTTP, prueba automatizada | 401 JSON para sesión inválida, 403 para permiso insuficiente y despacho de errores permitido. Parámetro obligatorio omitido conserva 400. No se homogeneizan todos los errores técnicos. |
| INC-10 | P2, inspección | TurnoEvento no asigna usuario aunque exista campo; motivo de reprogramación opcional. Resolver RN-09 y prueba de actor; CA-09. |
| INC-11 | Parcial, inspección y smoke de lógica | Disponibles limita pasado a ahora y excluye cierres. Reprogramación lista alternativas desde fecha; reserva rápida muestra primera. No hay hasta ni agenda arbitraria por rango; CA-13. |
| INC-12 | P2, inspección | Reprogramar permite turno original pasado si sigue activo. Definir y aplicar excepción administrativa del SRS. |
| INC-13 | Corregido para ejecución local | JWT propio de test; 14 pruebas de integración y 9 unitarias aprobadas. Docker local requirió api.version=1.44. CI remoto no consultado. |
| INC-14 | P2 antes de despliegue, inspección | CORS abierto, ddl-auto update y falta de migraciones/operación productiva. Aplicar configuración y CA-15. |
| INC-15 | P3, inspección | Pacientes sin query carga todos y limita en memoria; apertura consulta franjas en cada iteración; semana hace 15 GET. Medir y optimizar consultas según RNF. |

## Correcciones ya incorporadas

- `c93ccc0`: duración inicial de configuración pasó a 40; no migra registros existentes.
- `6999346`: calendario incluye profesionalId; selección múltiple de días y duración semanal desde configuración guardada; pasos y recarga tras generación.
- `96fc37a`: fecha seleccionada al centro, Hoy sólo si corresponde y fechas adyacentes.

La corrección del parámetro evita el 403 observado en ese calendario; no corrige todo el tratamiento HTTP del backend. La selección múltiple tampoco crea una transacción común de varios días.

## Decisiones de alcance pendientes

Se implementó la [matriz de cuatro roles solicitada](roles-permisos.md), con autorización HTTP y controles de interfaz. Quedan por definir el momento de previsualización de afectados y la obligatoriedad del motivo de reprogramación. Definir responsable técnico, respaldo, retención y recuperación. No expandir automáticamente a recordatorios, sincronización de feriados, reportes o portal paciente: requieren acuerdo específico.

## Orden de implementación

Validar visualmente INC-01/02/03/04, la generación con 40 fijos y la conservación del legado; después completar aceptación visual y operativa de permisos. Mantener mejoras de uso pequeñas cuando no comprometan esas reglas. Los cambios de esquema requieren un plan de datos previo. Relacionar cada cierre con el caso de [aceptación](pruebas-aceptacion.md), código y evidencia, y actualizar este registro.
