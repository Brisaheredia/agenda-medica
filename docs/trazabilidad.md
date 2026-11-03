# Trazabilidad de implementación y calidad

**Base:** alcance acordado con Salvador, cambios internos del equipo y correspondencia con RF/RN/RNF del documento inicial. Estado: 03/11/2026, con pacientes y obras sociales. La verificación formal corresponde a la entrega de Testing.

## Necesidades → implementación → comprobación prevista

| Necesidad / referencia | Implementación principal | Evidencia o comprobación pendiente |
|---|---|---|
| Pacientes / RF-02, RN-10/20 | PacienteController, PacienteService, PacienteRepository, Pacientes, BookingPanel y PacienteForm | Alta desde Recepción/Administración y desde Agenda por Obras Sociales; edición sólo R/A; localizar por DNI/contacto; rechazar DNI duplicado. |
| Obra social opcional / ampliación del equipo | ObraSocialController, ObraSocialService, ObraSocialRepository, Paciente.obraSocial, PacienteForm | Elegir, dar de alta desde selector, rechazar nombre duplicado; paciente particular sin obra social; comprobar visualización en turnos. |
| Horarios habituales / RF-04 | HorarioConsultorio, PlanificacionHorariosService, GeneracionMensual, Disponibilidad | Mes actual y tres futuros completos; 18 franjas por día hábil de 08:00 a 20:00; repetición sin duplicados. |
| Consultar agenda / RF-05, RF-11 | AgendaService, AgendaRangoService, useAgenda, CalendarioSemanalAgenda, CalendarioRangoAgenda y DiaCalendarioAgenda | Día/semana/rango, fechas sin horarios y cierres; nueva consulta al volver al foco y cada 30 segundos con pestaña visible. |
| Asignar / RF-06, RF-24, RN-01/15 | TurnoService, DisponibilidadService, FranjaRepository, BookingPanel | Reservar una franja libre y rechazar reserva concurrente o intervalo superpuesto. |
| Cancelar / RF-07, RN-08/17 | TurnoService, TurnoDialog, TurnoEvento | Conservar historial, liberar si no hay cierre, distinguir origen. |
| Suspender atención / RF-09, RF-10, RF-15 (solo cierre), RN-05/07 | AgendaController y AgendaService: `/bloqueos/previsualizacion` y `/bloqueos`; BloqueosPage | Advertir afectados antes, confirmar con revalidación, conservar turnos y prohibir aperturas nuevas y suspensiones en fines de semana. |
| Recuperar afectados / RF-17 | AgendaConsultaService, TurnoAfectadoResponse, Reprogramaciones | Recuperar pacientes/contactos tras reinicio y reprogramar uno a uno. |
| Reprogramar / RF-08, RN-09/19 | TurnoService, TurnoEventoRepository, HistorialTurnoDialog | Preservar ID, actor, motivo, franja anterior y nueva; rechazar destino ocupado. Obras Sociales no puede recuperar suspendidos (403). |
| Resultados / RF-12 | TurnoService, ListaTurnos | Atendido o ausente solo al alcanzar la fecha/hora del turno. |
| Accesos / RF-01, RF-20, RN-16 | SecurityConfig, JWT, UsuarioService, AuditoriaService, permisos.ts | Verificar matriz por rol, alta paciente desde Obras Sociales, catálogo, revocación de sesiones y ocultación de motivos. |

**Fuera de alcance funcional:** RF-03 como editor semanal, RF-15 como apertura, RF-16, RF-18, RF-19, RF-21 y RF-22 como configuración pública. No son defectos pendientes de implementación. Los identificadores se conservan para mostrar qué se descartó al validar el alcance.

## Objetivos no funcionales del análisis inicial

| RNF | Objetivo | Evidencia o límite actual |
|---|---|---|
| RNF-01 | Reserva en ≤5 interacciones | Evaluación de usabilidad pendiente. |
| RNF-02 | p95 agenda <1 s con 20 usuarios | Medición de carga pendiente. |
| RNF-03 | Búsqueda DNI <500 ms con 100.000 pacientes | Medición con volumen pendiente. |
| RNF-04 | Persistencia tras reinicio | MySQL y transacciones; comprobación operativa pendiente. |
| RNF-05 | Una reserva activa por franja | Bloqueo/validación por intervalo implementados; prueba de concurrencia formal posterior. |
| RNF-06 | Contraseñas con hash adaptativo | BCrypt implementado. |
| RNF-07 | Escrituras autenticadas y autorizadas | Spring Security y matriz de rutas presentes; revisar HTTP por rol. |
| RNF-08 | HTTPS desplegado | No acreditado en entorno de producción. |
| RNF-09 | Datos personales mínimos | Datos identificatorios/de contacto; revisar textos libres en auditoría. |
| RNF-10 | Usuario y fecha en operaciones críticas | AuditoriaService y TurnoEvento; eventos históricos sin usuario permanecen sin autor. |
| RNF-11 | Separación modular | PlanificacionHorariosService y AgendaService; DiaCalendarioAgenda compartido. |
| RNF-12 | Pruebas automáticas críticas | Hay pruebas existentes; revisar adecuación a cambios antes de ejecución formal. |
| RNF-13 | Navegadores actuales | Comprobación en Chrome/Edge/Firefox pendiente. |
| RNF-14 | Usabilidad desde 360 px | Estilos responsive; inspección de aceptación pendiente. |
| RNF-15 | Integridad referencial e índices | MySQL/JPA con índices; carga y planes SQL pendientes de medir. |
| RNF-16 | Respaldo y restauración | Procedimiento documentado; restauración pendiente de comprobar. |
| RNF-17 | Logs útiles sin datos sensibles | Revisión en entorno real pendiente. |
| RNF-18 | JSON y códigos HTTP | DTO y excepciones presentes; revisar contratos 400/403/409. |
| RNF-19 | OpenAPI/Swagger | Dependencia configurada; comprobar documentación generada en ejecución. |
| RNF-20 | Máximo un turno concurrente por franja | Transacciones y bloqueos presentes; ejecución formal de concurrencia pendiente. |

## Criterio de reporte

**Implementado en código ≠ probado ≠ aceptado por el cliente.** Las pruebas existentes y los resultados históricos se detallan en [pruebas](pruebas-aceptacion.md), pero no se atribuyen automáticamente al commit actual. La formalización de una suite y su acta corresponde a la siguiente entrega de la cátedra.

## Nuevos casos de comprobación vinculados

- **CA-20 — dos usuarios:** Recepción y Obras Sociales intentan reservar la misma franja desde sesiones separadas; sólo una reserva debe quedar confirmada. Luego Obras Sociales cancela con origen PACIENTE, y Recepción ve el horario liberado al recuperar foco o esperar la actualización.
- **CA-21 — obra social y pacientes:** Obras Sociales crea un paciente desde Asignar turno y registra una obra social nueva; se visualiza en la agenda, no se duplica el nombre y se rechazan intentos de modificar pacientes existentes desde ese rol.
- **CA-22 — límites del rol:** Obras Sociales no puede registrar motivo de consulta, cancelar por el consultorio ni recuperar turnos afectados por cierres; la recuperación funciona desde Recepción/Administración.
- **CA-23 — presentación:** no se muestra «Sin motivo informado» cuando el motivo de consulta es vacío; la obra social se imprime sólo cuando existe.

Las pruebas automatizadas agregadas y los recorridos manuales se detallan en [pruebas y aceptación](pruebas-aceptacion.md). No se registra una prueba como aprobada por el solo hecho de figurar en código.
