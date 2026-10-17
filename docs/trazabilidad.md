# Trazabilidad de requisitos y evidencias

Actualizado con colores y reprogramaciones, 17 de octubre de 2026. Relaciona requisitos del DOCX con implementación y verificaciones. Los casos CA son planes de aceptación, no ejecuciones aprobadas; el estado se mantiene en [pruebas](pruebas-aceptacion.md).

## Funcionalidad

Las rutas de archivos se expresan desde la raíz del repositorio. Para prioridades y diferencias consultar [requisitos](requisitos.md) y [pendientes](pendientes-riesgos.md).

| RF | Regla relacionada | Implementación principal | Verificación |
|---|---|---|---|
| RF-01 | RN-16 | AuthController/AuthService, security/, Login y api.ts | CA-01/12 |
| RF-02 | RN-10/20 | PacienteService/Repository, Pacientes y PacienteForm | CA-05 |
| RF-03 | RN-04/14 | AgendaService.crearPlantilla, Disponibilidad | CA-03/04/17 |
| RF-04 | RN-04/05/13 | AgendaService.generarFranjas y GeneracionMensual, FranjaRepository | CA-03/07/14 |
| RF-05 | RN-01/12 | AgendaController, TurnoController, useAgenda, Agenda | CA-06/16 |
| RF-06 | RN-01/03/10/15 | TurnoService.crear, BookingPanel | CA-06/07 |
| RF-07 | RN-08/11/17 | TurnoService.cancelar, DisponibilidadService, TurnoDialog | CA-08 |
| RF-08 | RN-09/15/19 | TurnoService.reprogramar, TurnoEvento, TurnoDialog | CA-09/18 |
| RF-09 | RN-05/07 | AgendaService.crearBloqueo/crearExcepcion, Bloqueos | CA-08/10 |
| RF-10 | RN-07 | Cierres puntuales devuelven IDs posteriores; contactos recuperables en Reprogramaciones | CA-10; previsualización pendiente |
| RF-11 | RN-12/13 | CalendarioSemanalAgenda/Disponibilidad y GET diarios | CA-13/16; falta rango |
| RF-12 | RN-18 | TurnoService.cambiarEstadoFinal, ListaTurnos | CA-11/12 |
| RF-13 | RN-09/11 | TurnoEventoRepository; falta endpoint/pantalla | CA-09 ampliado |
| RF-14 | RN-13/19 | AgendaService.disponibles, BookingPanel.buscarProxima | CA-13 |
| RF-15 | RN-04/05 | AgendaService.crearExcepcion, Bloqueos | CA-07/10/17 |
| RF-16 | RN-06/07 | Plantilla con vigencias, sin reemplazo integral | CA-03 ampliado |
| RF-17 | RN-07/09 | AgendaConsultaService/Controller, TurnoAfectadoResponse y Reprogramaciones | CA-10 |
| RF-18 | — | Sin implementación; excluido | No exigido en aceptación actual |
| RF-19 | RN-16 | Sin portal; excluido | No exigido en aceptación actual |
| RF-20 | RN-09/17 | AuditoriaService y TurnoEvento | CA-08/09/12 |
| RF-21 | — | Sólo resumen diario; reporte pendiente de fase | No exigido en aceptación actual |
| RF-22 | RN-13/14 | ConfiguracionAgendaService, Disponibilidad | CA-02/17 |
| RF-23 | RN-05/07 | Cierre manual de fecha en Bloqueos | CA-08/10 |
| RF-24 | RN-01/15 | PESSIMISTIC_WRITE en FranjaRepository | Test concurrente aprobado en MySQL; CA-06/18 |

## Calidad del documento inicial

| RNF | Objetivo | Evidencia actual o validación necesaria |
|---|---|---|
| RNF-01 | Reserva en hasta 5 interacciones principales | Medir recorrido normal; no medido |
| RNF-02 | Agenda p95 <1 s, 20 usuarios | Prueba de carga pendiente |
| RNF-03 | DNI <500 ms con 100.000 pacientes | Carga de datos/prueba pendiente |
| RNF-04 | Reinicio sin perder confirmados | MySQL/transacciones presentes; demostrar persistencia/reinicio |
| RNF-05 | Un activo por franja | Bloqueo pesimista y test de doble reserva aprobados en MySQL de prueba |
| RNF-06 | BCrypt/Argon2 | BCrypt implementado |
| RNF-07 | Autenticación/autorización en escritura | SecurityConfig presente; matriz HTTP por ejecutar |
| RNF-08 | HTTPS desplegado | No se verificó despliegue |
| RNF-09 | Datos personales mínimos | Campos básicos; revisar texto libre/auditoría |
| RNF-10 | Usuario y timestamp críticos | Auditoría general; actor de TurnoEvento pendiente |
| RNF-11 | Separación de responsabilidades | DisponibilidadService (5 colaboradores), generación por mes dentro de AgendaService y AgendaConsultaService (2); AgendaService todavía con 7 |
| RNF-12 | Pruebas automatizadas críticas | 14 tests de integración + 9 unitarios aprobados; cobertura HTTP/UI/carga incompleta |
| RNF-13 | Chrome/Edge/Firefox actuales | Matriz de navegadores pendiente |
| RNF-14 | Uso desde 360 px | CSS adaptable; comprobación de aceptación pendiente |
| RNF-15 | Claves/índices apropiados | Anotaciones JPA inspeccionadas; carga/rendimiento pendiente |
| RNF-16 | Backup/restauración documentados | Procedimiento incluido; restauración pendiente |
| RNF-17 | Logs útiles sin exposición | Revisar entorno/logs y texto libre; sin acta integral |
| RNF-18 | JSON/códigos coherentes | DTO/advice presentes; contrato de errores parcial |
| RNF-19 | OpenAPI/Swagger | Dependencia/rutas configuradas; contrastar esquema al desplegar |
| RNF-20 | A lo sumo una reserva concurrente | Reserva y reprogramación del mismo turno concurrentes aprobadas; reservas superpuestas entre IDs aprobadas; cierres/generación comparten el bloqueo del profesional |

## Cómo registrar una ejecución

Para cada caso conservar ID, commit, fecha/zona, entorno, rol, datos ficticios/precondiciones, pasos, resultado esperado/obtenido, evidencia y defecto asociado. Resultado permitido: aprobado, fallido, bloqueado o no ejecutado. Bloqueado por Docker no significa aprobado ni fallo de una regla de negocio. No asignar un porcentaje global sin ponderación y alcance acordados.
