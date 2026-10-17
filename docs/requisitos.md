# Requisitos y alcance

Base: DOCX inicial, correo del equipo al doctor y confirmaciones del responsable del proyecto. Fuentes en [referencias](referencias/README.md). Estado contrastado con `96fc37a`; “implementado en código” no significa aceptación integral aprobada.

## Contexto y decisiones confirmadas

Problema: agenda distribuida/manual, horarios liberados que no se reutilizan y compromisos superpuestos. Solución: una agenda web centralizada operada por el consultorio para un profesional.

- Días y horario comunicados: lunes a viernes, 08:00–20:00.
- Duración estándar inicial: 40 minutos; configurable y común para las nuevas franjas. El registro vigente de BD determina su valor.
- El consultorio registra pacientes y opera reservas.
- Una cancelación libera sólo si no hay bloqueo aplicable.
- Una suspensión conserva compromisos y requiere listar pacientes/contactos para reprogramación manual.
- Se excluyen historia clínica, recetas, pagos/facturación, autogestión, mensajería automática y reprogramación automática. Sin operación multi-profesional ni múltiples sedes.

## Actores y glosario

Administración configura y mantiene; recepción gestiona pacientes/reservas; médico consulta y registra resultados con los permisos actuales. El paciente es destinatario de la cita, sin cuenta pública. La matriz técnica se documenta en [API](api.md); sus diferencias con los casos de uso iniciales requieren validación del equipo.

Una **plantilla** es una regla semanal con vigencia. Una **franja** es un intervalo concreto persistido. Un **turno** es el compromiso del paciente sobre una franja. Una **excepción** cierra o abre una fecha. **Horizonte** es la anticipación máxima de reserva.

## Catálogo funcional

Se conservan los IDs del documento de origen. La prioridad refleja el acuerdo actual; los elementos de fases futuras no se convierten automáticamente en obligaciones de esta entrega.

| ID | Requisito | Prioridad y estado |
|---|---|---|
| RF-01 | Credenciales individuales y sesión | MVP; implementado en código |
| RF-02 | Crear, consultar, editar y buscar pacientes | MVP; parcial: DNI/apellido, sin contacto |
| RF-03 | Definir días/horas y duración estándar | MVP; selección múltiple implementada; coherencia global pendiente |
| RF-04 | Generar franjas según reglas/horizonte | MVP; parcial, ver riesgos de generación |
| RF-05 | Agenda diaria con libres/ocupadas/bloqueadas | MVP; implementado en código |
| RF-06 | Reservar paciente activo en franja libre | MVP; parcial por solapamientos entre franjas |
| RF-07 | Cancelar con actor, fecha y motivo | MVP; parcial por liberación dentro de cierres |
| RF-08 | Reprogramar con identidad e historial | MVP; parcial por actor de evento y concurrencia |
| RF-09 | Bloquear período futuro | MVP; cierre por fecha/horas implementado, límites pendientes |
| RF-10 | Mostrar afectados antes de confirmar | Fase 2 original; no hay previsualización |
| RF-11 | Consultar por día, semana y rango | MVP; día/semana presentes, rango arbitrario pendiente |
| RF-12 | Registrar atendido/ausente | MVP; implementado; revisar roles acordados |
| RF-13 | Mostrar historial de un turno | Fase 2; eventos almacenados sin consulta específica |
| RF-14 | Sugerir próximos libres desde fecha | MVP; API con desde, UI sólo primer resultado desde ahora |
| RF-15 | Registrar aperturas y cierres | MVP; parcial por duración y precedencia |
| RF-16 | Cambiar plantilla con vigencia | Fase 2; hay vigencias, no reemplazo integral |
| RF-17 | Listar afectados y resolver uno a uno | Necesario para esta entrega por confirmación actual; sólo IDs hoy |
| RF-18 | Notificaciones | Excluido; Fase 3 original |
| RF-19 | Portal de paciente | Excluido; Fase 3 original |
| RF-20 | Auditoría crítica con usuario/fecha | MVP; general presente, actor de TurnoEvento pendiente |
| RF-21 | Reportes por período | Fase 2; no implementado |
| RF-22 | Configurar duración y horizonte | MVP; persistencia implementada, aplicación uniforme parcial |
| RF-23 | Cargar días no laborables | MVP; manual por cierre, conservación efectiva pendiente |
| RF-24 | Impedir doble reserva concurrente | MVP; misma franja protegida, test escrito |

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
| RN-13, RN-14 | Horizonte y duración configurables |
| RN-16, RN-17, RN-18 | Autorizar cambios, exigir motivo de cancelación y resultado sólo desde el inicio |

RN-07 exige aviso previo de afectados, mientras RF-10 lo prioriza en Fase 2. Registrar una decisión sobre previsualización; la lista operativa posterior sí fue solicitada actualmente. RF-08 deja motivo opcional en código aunque RN-09 enumera motivo como dato del evento; acordar obligatoriedad sin ocultar la diferencia.

## Calidad y aceptación

Objetivos del documento inicial: reserva en hasta 5 interacciones principales; percentil 95 de agenda menor a 1 s con 20 usuarios; DNI exacto menor a 500 ms con 100.000 pacientes; recuperación tras reinicio; hash adaptativo; autorización y HTTPS; datos mínimos; auditoría; modularidad; pruebas críticas; Chrome/Edge/Firefox; uso a 360 px; claves/índices; respaldo/restauración; logs suficientes y API JSON/OpenAPI.

Son **objetivos a verificar**, sin mediciones aprobadas en esta revisión. La matriz completa de los 20 RNF y su evidencia está en [trazabilidad](trazabilidad.md). El fan-out bajo es un objetivo adicional del equipo: revisar responsabilidades y colaboradores, no sólo cantidad de imports.

El MVP se acepta al demostrar el circuito completo de pacientes, horario, reserva, cancelación/reprogramación e integridad, y el tratamiento manual de pacientes afectados acordado. Criterios, casos y evidencias en [pruebas](pruebas-aceptacion.md). No declarar terminado mientras existan defectos P1 que impidan ese circuito.
