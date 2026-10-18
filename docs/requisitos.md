# Requisitos y alcance

Base: DOCX inicial, correo del equipo al doctor y confirmaciones del responsable del proyecto. Fuentes en [referencias](referencias/README.md). Estado actualizado el 17 de octubre de 2026 con colores y reprogramaciones; “implementado en código” no significa aceptación integral aprobada.

## Contexto y decisiones confirmadas

Problema: agenda distribuida/manual, horarios liberados que no se reutilizan y compromisos superpuestos. Solución: una agenda web centralizada operada por el consultorio para un profesional.

- Días y horario comunicados: lunes a viernes, 08:00–20:00.
- Duración fija: 40 minutos por decisión final del responsable. Reemplaza el acuerdo anterior de duración configurable. El backend impone la regla y el frontend la informa.
- El consultorio registra pacientes y opera reservas.
- Una cancelación libera sólo si no hay bloqueo aplicable.
- Una suspensión conserva compromisos y requiere listar pacientes/contactos para reprogramación manual.
- Se excluyen historia clínica, recetas, pagos/facturación, autogestión, mensajería automática y reprogramación automática. Sin operación multi-profesional ni múltiples sedes.

## Actores y glosario

Administración configura, mantiene y opera; Recepción gestiona pacientes, turnos y resultados; Médico consulta, modifica horarios, bloquea atención y registra resultados; Obras sociales consulta agenda/disponibilidad y gestiona turnos de pacientes existentes con datos mínimos. El paciente es destinatario de la cita, sin cuenta pública. Se implementa la [matriz de roles](roles-permisos.md) solicitada posteriormente al documento inicial.

Una **plantilla** es una regla semanal con vigencia. Una **franja** es un intervalo concreto persistido. Un **turno** es el compromiso del paciente sobre una franja. Una **excepción** cierra o abre una fecha. **Horizonte** es la anticipación máxima de reserva.

## Catálogo funcional

Se conservan los IDs del documento de origen. La prioridad refleja el acuerdo actual; los elementos de fases futuras no se convierten automáticamente en obligaciones de esta entrega.

| ID | Requisito | Prioridad y estado |
|---|---|---|
| RF-01 | Credenciales individuales y sesión | MVP; implementado en código |
| RF-02 | Crear, consultar, editar y buscar pacientes | MVP; parcial: DNI/apellido, sin contacto |
| RF-03 | Definir días/horas y duración estándar | MVP; selección múltiple y duración fija 40 en generación/apertura |
| RF-04 | Generar franjas según reglas/horizonte | MVP; un mes por operación, generación de 40 y conservación de compromisos |
| RF-05 | Agenda diaria con libres/ocupadas/bloqueadas | MVP; implementado en código |
| RF-06 | Reservar paciente activo en franja libre | MVP; validación por intervalo y bloqueo del profesional |
| RF-07 | Cancelar con actor, fecha y motivo | MVP; distingue origen y respeta cierres; actor de TurnoEvento pendiente |
| RF-08 | Reprogramar con identidad e historial | MVP; identidad y bloqueo de turno implementados; actor de evento pendiente |
| RF-09 | Bloquear período futuro | MVP; cierre por fecha/horas implementado, límites pendientes |
| RF-10 | Mostrar afectados antes de confirmar | Fase 2 original; previsualización pendiente, contactos disponibles tras suspensión |
| RF-11 | Consultar por día, semana y rango | MVP; día/semana presentes, rango arbitrario pendiente |
| RF-12 | Registrar atendido/ausente | MVP; implementado para Administración, Médico y Recepción |
| RF-13 | Mostrar historial de un turno | Fase 2; eventos almacenados sin consulta específica |
| RF-14 | Sugerir próximos libres desde fecha | MVP; diálogo de reprogramación lista alternativas desde fecha; búsqueda rápida de reserva muestra la primera |
| RF-15 | Registrar aperturas y cierres | MVP; duración fija 40 y rechazo de superposiciones; cierre prevalece |
| RF-16 | Cambiar plantilla con vigencia | Fase 2; hay vigencias, no reemplazo integral |
| RF-17 | Listar afectados y resolver uno a uno | Implementado en código: pendientes con contacto y reprogramación individual; aceptación visual pendiente |
| RF-18 | Notificaciones | Excluido; Fase 3 original |
| RF-19 | Portal de paciente | Excluido; Fase 3 original |
| RF-20 | Auditoría crítica con usuario/fecha | MVP; general presente, actor de TurnoEvento pendiente |
| RF-21 | Reportes por período | Fase 2; no implementado |
| RF-22 | Configurar duración y horizonte | MVP; horizonte persistido y duración fija 40 según decisión actual |
| RF-23 | Cargar días no laborables | MVP; cierre manual, turnos conservados y liberación protegida |
| RF-24 | Impedir doble reserva concurrente | MVP; misma franja protegida, test de concurrencia aprobado en MySQL de prueba |

## Reglas de negocio verificables

| Reglas del origen | Comportamiento requerido |
|---|---|
| RN-01, RN-15 | Un turno activo por franja; revalidar dentro de la transacción |
| RN-02, RN-03, RN-12 | Inicio/fin válidos, reserva futura y zona consistente |
| RN-04, RN-05 | Combinar plantilla/excepción; cierre prevalece |
| RN-06, RN-07 | Conservar compromisos y advertir afectados |
| RN-08, RN-19 | Liberar sólo sin bloqueo; no mover a franja cerrada/ocupada |
| RN-09, RN-11 | Guardar historial; no borrar turnos; registrar usuario, fecha, origen/destino y motivo |
| RN-10, RN-20 | Paciente previo y datos mínimos para identificar/contactar |
| RN-13, RN-14 | Horizonte configurable; duración fija 40 por decisión posterior al documento inicial |
| RN-16, RN-17, RN-18 | Autorizar cambios, exigir motivo de cancelación y resultado sólo desde el inicio |

RN-07 exige aviso previo de afectados, mientras RF-10 lo prioriza en Fase 2. Registrar una decisión sobre previsualización; la lista operativa posterior sí fue solicitada actualmente. RF-08 deja motivo opcional en código aunque RN-09 enumera motivo como dato del evento; acordar obligatoriedad sin ocultar la diferencia.

## Duración fija y generación mensual

La última decisión del responsable fija los turnos en 40 minutos y descarta el cambio de duración, su previsualización y la migración mensual. Se habilita un mes por vez dentro de la anticipación máxima. No se cancelan ni reprograman pacientes automáticamente al generar. Las franjas futuras libres de otra duración se limpian sólo si no tienen citas ni eventos históricos; cualquier otro solapamiento revierte la operación sin perder datos. La reprogramación por suspensión del consultorio permanece vigente.

## Convenciones visuales confirmadas

Rojo para suspensión del consultorio, naranja para cancelación del paciente, verde para horarios disponibles, azul para ocupados y gris claro para fechas sin horarios/pasados o cancelaciones históricas sin origen. Domingo con fondo rojizo. La etiqueta textual aclara el estado; la prioridad de un encabezado mixto se describe en el manual.

La suspensión de días corresponde a Administración y Médico según la [matriz solicitada](roles-permisos.md). Recepción coordina pacientes y reprogramaciones, pero no modifica horarios ni bloquea días.

## Calidad y aceptación

Objetivos del documento inicial: reserva en hasta 5 interacciones principales; percentil 95 de agenda menor a 1 s con 20 usuarios; DNI exacto menor a 500 ms con 100.000 pacientes; recuperación tras reinicio; hash adaptativo; autorización y HTTPS; datos mínimos; auditoría; modularidad; pruebas críticas; Chrome/Edge/Firefox; uso a 360 px; claves/índices; respaldo/restauración; logs suficientes y API JSON/OpenAPI.

Son **objetivos a verificar**, sin mediciones aprobadas en esta revisión. La matriz completa de los 20 RNF y su evidencia está en [trazabilidad](trazabilidad.md). El fan-out bajo es un objetivo adicional del equipo: revisar responsabilidades y colaboradores, no sólo cantidad de imports.

El MVP se acepta al demostrar el circuito completo de pacientes, horario, reserva, cancelación/reprogramación e integridad, y el tratamiento manual de pacientes afectados acordado. Criterios, casos y evidencias en [pruebas](pruebas-aceptacion.md). No declarar terminado mientras existan defectos P1 que impidan ese circuito.
