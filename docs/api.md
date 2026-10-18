# Contrato de API

Contrato actualizado el 17 de octubre de 2026 con consultas de excepciones y reprogramaciones. Base `/api`, JSON UTF-8. URL de ejemplo basada en el valor por defecto del proyecto: `http://localhost:8080`. Sustituir host y puerto por los efectivos de cada entorno; el contrato no exige un puerto particular. OpenAPI generado en `/v3/api-docs` y Swagger en `/swagger-ui.html` complementan esta descripción.

## Autenticación y convenciones

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{"email":"operador@example.test","password":"CONTRASENA_DEL_OPERADOR"}
```

Respuesta 200: `{token, tokenType, expiresInMinutes, email, rol}`; tokenType es Bearer y expiración inicial 480 minutos. Enviar `Authorization: Bearer <token>` en las demás operaciones. Email/clave son ejemplos, no una cuenta preexistente. Credenciales incorrectas devuelven actualmente **400** desde AuthService, no 401. No hay refresh ni endpoint de logout; el frontend elimina su sesión local.

Roles: **A**=ADMIN, **R**=RECEPCION, **M**=MEDICO, **O**=OBRAS_SOCIALES, **T**=cualquiera de esos cuatro roles. Ver [matriz y límites de datos](roles-permisos.md). Fechas `YYYY-MM-DD`, horas `HH:mm` y fecha/hora local `YYYY-MM-DDTHH:mm:ss`. Enviar todos los parámetros obligatorios; no hay un profesional predeterminado para las consultas.

## Endpoints existentes

| Método | Ruta y parámetros | Permiso | Éxito / respuesta |
|---|---|---|---|
| POST | `/auth/login` | Público | 200 LoginResponse |
| GET | `/profesionales` | T | 200 ProfesionalResponse[] activos |
| GET | `/pacientes?query=` | A,M,R | 200 PacienteResponse[] |
| GET | `/pacientes/{id}` | A,M,R | 200 PacienteResponse |
| GET | `/pacientes/seleccion?query=Apellido` | T | 200 PacienteSeleccionResponse[], mínimo tres caracteres |
| POST | `/pacientes` | A,R | 201 PacienteResponse |
| PUT | `/pacientes/{id}` | A,R | 200 PacienteResponse |
| DELETE | `/pacientes/{id}` | A,R | 204, baja lógica |
| GET | `/agenda?profesionalId=1&fecha=2026-10-19` | T | 200 FranjaResponse[] |
| GET | `/agenda/disponibles?profesionalId=1&desde=2026-10-19T08:00:00` | T | 200 FranjaResponse[] |
| GET | `/agenda/excepciones?profesionalId=1&desde=2026-10-19&hasta=2026-10-25` | T | 200 ExcepcionAgendaResumen[] |
| GET | `/agenda/reprogramaciones-pendientes?profesionalId=1` | A,M,R | 200 TurnoAfectadoResponse[] |
| POST | `/agenda/plantillas` | A,M | 201 PlantillaDisponibilidadResponse |
| POST | `/agenda/generar-franjas` | A,M | 200 GenerarFranjasResponse, aditiva y limitada a un mes |
| POST | `/agenda/excepciones` | A,M | 201 ExcepcionAgendaResponse |
| POST | `/agenda/bloqueos` | A,M | 201 ExcepcionAgendaResponse |
| GET | `/configuracion/agenda` | T | 200 ConfiguracionAgendaResponse |
| PUT | `/configuracion/agenda` | A | 200 ConfiguracionAgendaResponse |
| GET | `/turnos?profesionalId=1&fecha=2026-10-19` | T | 200 TurnoResponse[] |
| GET | `/turnos/{id}` | T | 200 TurnoResponse |
| POST | `/turnos` | A,R,O | 201 TurnoResponse |
| POST | `/turnos/{id}/cancelacion` | A,R,O | 200 TurnoResponse |
| POST | `/turnos/{id}/reprogramacion` | A,R,O | 200 TurnoResponse |
| POST | `/turnos/{id}/atencion` | A,M,R | 200 TurnoResponse, sin cuerpo de entrada |
| POST | `/turnos/{id}/ausencia` | A,M,R | 200 TurnoResponse, sin cuerpo de entrada |
| GET | `/auditoria` | A | 200 AuditoriaResponse[], últimos 100 |
| GET | `/usuarios` | A | 200 UsuarioResponse[] |
| POST | `/usuarios` | A | 201 UsuarioResponse |
| PATCH | `/usuarios/{id}/activo?activo=false` | A | 200 UsuarioResponse |
| PUT | `/usuarios/{id}/rol` | A | 200 UsuarioResponse |
| PUT | `/usuarios/{id}/password` | A | 204 |

Para `/agenda/disponibles`, desde es opcional y profesionalId obligatorio. Para las consultas diarias ambos parámetros son obligatorios. Los ejemplos de fechas/IDs deben adaptarse a una base de pruebas; no asumen filas existentes ni siguen siendo futuros indefinidamente.

## Cuerpos de escritura

### Paciente

POST y PUT utilizan el mismo cuerpo completo:

```json
{"dni":"DNI_FICTICIO","nombre":"Paciente","apellido":"Ejemplo","telefono":"","email":"paciente@example.test"}
```

DNI obligatorio, máximo 20; nombre/apellido obligatorios, máximo 100 cada uno; teléfono opcional hasta 50; email opcional con formato de email y máximo 150. Se normalizan espacios; DNI duplicado produce conflicto de negocio. Buscar sin query devuelve hasta 20 activos después de filtrar en memoria; DNI exacto tiene precedencia; de lo contrario se busca apellido, hasta 20 ordenados. No hay búsqueda por contacto ni paginación pública.

### Configuración

```json
{"duracionEstandarMin":40,"horizonteReservaDias":90}
```

Duración fija de 40; horizonte entero de 1 a 365. GET devuelve siempre 40 y el horizonte persistido (90 si no existe). PUT permite omitir duracionEstandarMin o enviar 40; otro valor devuelve 400. Sólo se configura el horizonte. La columna de duración anterior se conserva por compatibilidad y se normaliza a 40 al guardar, sin reescribir citas ni franjas históricas.

### Plantilla semanal

```json
{"profesionalId":1,"diaSemana":"MONDAY","horaInicio":"08:00","horaFin":"20:00","duracionMin":40,"vigenciaDesde":"2026-10-19","vigenciaHasta":null}
```

Día enum MONDAY…SUNDAY; campos obligatorios salvo vigenciaHasta; duracionMin opcional y restringida a 40. Fin posterior a inicio y vigenciaHasta no anterior a vigenciaDesde. duracionMin es opcional por compatibilidad; si se envía debe ser 40. Otro valor devuelve 400. La plantilla nueva siempre guarda 40. El frontend de selección múltiple realiza una llamada por día; no existe endpoint de lote.

### Generación

```json
{"profesionalId":1,"desde":"2026-10-19","hasta":"2026-10-23"}
```

Contrato anterior aditivo: fechas obligatorias, dentro del mismo mes y horizonte. Usa el estándar guardado; omite pasado y cierres, conserva intervalos exactamente iguales y rechaza cualquier otra superposición con 409. Respuesta `{creadas, existentes, omitidasPorCierre}`. La operación conserva compromisos e historial; no hay circuito de cambio de duración.

La generación utiliza el horario vigente más reciente por día y siempre 40 minutos. Antes de crear retira únicamente franjas futuras LIBRES de otra duración que no tengan referencias en Turno ni TurnoEvento. Todo ocurre en una transacción con bloqueo del profesional; ante una superposición con datos preservados responde 409 y revierte cambios. No cancela ni mueve turnos.

### Cierre, bloqueo y apertura

POST `/agenda/bloqueos` recibe:

```json
{"profesionalId":1,"fecha":"2026-10-20","horaInicio":"10:00","horaFin":"12:00","motivo":"Suspensión de atención"}
```

Ambas horas null/omitidas representan día completo; deben enviarse juntas si se usa intervalo. Fecha no pasada y motivo opcional hasta 255. El bloqueo se convierte en excepción CIERRE.

POST `/agenda/excepciones` usa el mismo núcleo más tipo y duración:

```json
{"profesionalId":1,"fecha":"2026-10-24","horaInicio":"08:00","horaFin":"12:00","tipo":"APERTURA","duracionMin":40,"motivo":"Atención extraordinaria"}
```

Tipo obligatorio APERTURA/CIERRE. APERTURA exige ambas horas; duracionMin es opcional y sólo admite 40; para CIERRE la duración puede ser null. Se conservan compromisos y se devuelven afectados después de guardar.

### Turnos

Crear:

```json
{"pacienteId":1,"franjaId":10,"motivoConsulta":"Consulta de ejemplo"}
```

Paciente/franja obligatorios, motivo opcional hasta 500. Paciente activo; franja de exactamente 40 minutos, futura y dentro del horizonte, LIBRE, sin cierre ni otro turno activo del mismo profesional en un intervalo superpuesto. Reserva/reprogramación y generación se coordinan con bloqueo por profesional.

Cancelar:

```json
{"motivo":"Cambio solicitado por el paciente","origen":"PACIENTE"}
```

Motivo obligatorio no vacío, máximo 500. Origen PACIENTE o CONSULTORIO; omitido/null se interpreta PACIENTE para compatibilidad con clientes previos. Esto no rellena el origen de turnos históricos. CONSULTORIO bloquea el horario y deja pendiente al paciente; PACIENTE libera sólo sin cierre aplicable. Reprogramar:

```json
{"franjaId":11,"motivo":"Nuevo horario coordinado"}
```

Destino obligatorio y distinto del actual; motivo opcional máximo 500; requiere turno activo o cancelado con origen CONSULTORIO, y destino válido. Una cancelación CONSULTORIO reprogramada pasa a RESERVADO y limpia sus campos actuales de cancelación; el evento anterior se conserva. Atención/ausencia no requieren cuerpo y sólo se admiten a partir del inicio del turno.

### Usuarios

```json
{"email":"recepcion@example.test","password":"CONTRASENA_SEGURA_DE_PRUEBA","rol":"RECEPCION"}
```

Email obligatorio válido y único; password de al menos 8 caracteres y hasta 72 bytes UTF-8; rol ADMIN/MEDICO/RECEPCION/OBRAS_SOCIALES obligatorio. El alta activa al usuario y guarda BCrypt. PATCH activo usa parámetro de consulta. PUT rol acepta `{ "rol": "OBRAS_SOCIALES" }`; PUT password acepta `{ "password": "NUEVA_CLAVE_SEGURA" }` y no devuelve la clave. No se puede desactivar o degradar al último administrador activo (409). Cambiar rol o contraseña invalida los tokens anteriores; desactivar también impide usarlos.

## Esquemas de respuesta

| DTO | Campos |
|---|---|
| PacienteResponse | id, dni, nombre, apellido, telefono, email, activo |
| PacienteSeleccionResponse | id, dni, nombre, apellido, activo; sin teléfono/email |
| ProfesionalResponse | id, nombre, apellido, matricula, activo |
| FranjaResponse | id, profesionalId, inicio, fin, estado, origen |
| TurnoResponse | id, pacienteId, paciente (apellido/nombre), profesionalId, franjaId, inicio, fin, estado, motivoConsulta, createdAt, origenCancelacion, motivoCancelacion |
| PlantillaDisponibilidadResponse | id, profesionalId, diaSemana, horaInicio, horaFin, duracionMin, vigenciaDesde, vigenciaHasta |
| ExcepcionAgendaResponse | id, profesionalId, fecha, horaInicio, horaFin, tipo, motivo, franjasCreadas, franjasBloqueadas, turnosAfectados (IDs) |
| ExcepcionAgendaResumen | id, profesionalId, fecha, horaInicio, horaFin, tipo, motivo |
| TurnoAfectadoResponse | turno (TurnoResponse), dni, telefono, email, motivo de suspensión |
| ConfiguracionAgendaResponse | duracionEstandarMin, horizonteReservaDias |
| AuditoriaResponse | id, accion, entidad, entidadId, fecha, metadata, usuarioId |
| UsuarioResponse | id, email, rol, activo; nunca passwordHash |

Los horarios libres están limitados por el horizonte y se ordenan por inicio. No aceptan hasta, no generan franjas y no devuelven pacientes. Un desde pasado se ajusta a ahora; el límite superior siempre se calcula desde ahora, y se excluyen otras duraciones, cierres aplicables y solapamientos con turnos activos.

## Errores y límites

El advice de negocio devuelve `{timestamp,status,error,message,path,validationErrors}`. 400 para validación/regla inválida y credenciales incorrectas; 404 para recursos no encontrados; 409 para conflictos explícitos. validationErrors puede ser null o un objeto por campo.

Spring Security responde JSON `{message}` con 401 ante sesión ausente/inválida/inactiva o credenciales/rol cambiados, y 403 ante operación no autorizada. Los despachos de error se permiten para que omitir profesionalId conserve el 400 correspondiente. No todos los errores técnicos pasan por el advice de negocio.

La consulta de excepciones requiere profesionalId, desde y hasta (inclusive); rechaza hasta anterior a desde. Pendientes devuelve activos afectados por cierres y cancelados con origen CONSULTORIO, ordenados por inicio y sin duplicar por cierres solapados. Incluye fechas pasadas aún sin resolver y excluye cancelados por paciente o sin origen. No necesita una consulta por paciente. La lista con contactos sólo está disponible para A,M,R. O puede reprogramar desde la agenda; no recibe motivos de consulta/cancelación en TurnoResponse y al crear se ignora motivoConsulta. O sólo puede cancelar con origen PACIENTE (o null, que equivale a PACIENTE); CONSULTORIO devuelve 403.

No existen GET de plantillas/conflictos, historial de eventos por turno, agenda arbitraria por rango, búsqueda de usuarios por email, alta de profesional, confirmación explícita, notificaciones ni portal público. Distinguirlos de operaciones previstas por el SRS. El [registro de pendientes](pendientes-riesgos.md) indica diferencias y prioridades.
