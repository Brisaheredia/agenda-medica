# Trazabilidad de implementación y calidad

**Base:** alcance acordado con Salvador y correspondencia con RF/RN/RNF del documento inicial. Estado: 29/10/2026, posterior a refactorización de agenda y retiro de aperturas. La verificación formal corresponde a la entrega de Testing.

## Necesidades → implementación → comprobación prevista

| Necesidad / referencia | Implementación principal | Evidencia o comprobación pendiente |
|---|---|---|
| Pacientes / RF-02, RN-10/20 | PacienteController, PacienteService, PacienteRepository, Pacientes y PacienteForm | Registrar/editar, localizar por DNI, apellido y contacto; rechazar DNI duplicado. |
| Horarios habituales / RF-04 | HorarioConsultorio, PlanificacionHorariosService, GeneracionMensual, Disponibilidad | Mes actual y tres futuros completos; 18 franjas por día hábil de 08:00 a 20:00; repetición sin duplicados. |
| Consultar agenda / RF-05, RF-11 | AgendaService, AgendaRangoService, CalendarioSemanalAgenda, CalendarioRangoAgenda y DiaCalendarioAgenda | Día/semana/rango, fechas sin horarios y cierres. |
| Asignar / RF-06, RF-24, RN-01/15 | TurnoService, DisponibilidadService, FranjaRepository, BookingPanel | Reservar una franja libre y rechazar reserva concurrente o intervalo superpuesto. |
| Cancelar / RF-07, RN-08/17 | TurnoService, TurnoDialog, TurnoEvento | Conservar historial, liberar si no hay cierre, distinguir origen. |
| Suspender atención / RF-09, RF-10, RF-15 (solo cierre), RN-05/07 | AgendaController y AgendaService: `/bloqueos/previsualizacion` y `/bloqueos`; BloqueosPage | Advertir afectados antes, confirmar con revalidación, conservar turnos y prohibir aperturas nuevas y suspensiones en fines de semana. |
| Recuperar afectados / RF-17 | AgendaConsultaService, TurnoAfectadoResponse, Reprogramaciones | Recuperar pacientes/contactos tras reinicio y reprogramar uno a uno. |
| Reprogramar / RF-08, RN-09/19 | TurnoService, TurnoEventoRepository, HistorialTurnoDialog | Preservar ID, actor, motivo, franja anterior y nueva; rechazar destino ocupado. |
| Resultados / RF-12 | TurnoService, ListaTurnos | Atendido o ausente solo al alcanzar la fecha/hora del turno. |
| Accesos / RF-01, RF-20, RN-16 | SecurityConfig, JWT, UsuarioService, AuditoriaService, permisos.ts | Verificar matriz por rol, revocación de sesiones y datos mínimos. |

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
