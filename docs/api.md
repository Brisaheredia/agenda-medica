# Contrato de API

Contrato del código `96fc37a`. Base `/api`, JSON UTF-8. URL de ejemplo basada en el valor por defecto del proyecto: `http://localhost:8080`. Sustituir host y puerto por los efectivos de cada entorno; el contrato no exige un puerto particular. OpenAPI generado en `/v3/api-docs` y Swagger en `/swagger-ui.html` complementan esta descripción.

## Autenticación y convenciones

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{"email":"operador@example.test","password":"CONTRASENA_DEL_OPERADOR"}
```

Respuesta 200: `{token, tokenType, expiresInMinutes, email, rol}`; tokenType es Bearer y expiración inicial 480 minutos. Enviar `Authorization: Bearer <token>` en las demás operaciones. Email/clave son ejemplos, no una cuenta preexistente. Credenciales incorrectas devuelven actualmente **400** desde AuthService, no 401. No hay refresh ni endpoint de logout; el frontend elimina su sesión local.

Roles: **A**=ADMIN, **R**=RECEPCION, **M**=MEDICO, **T**=cualquiera autenticado. Fechas `YYYY-MM-DD`, horas `HH:mm` y fecha/hora local `YYYY-MM-DDTHH:mm:ss`. Enviar todos los parámetros obligatorios; no hay un profesional predeterminado para las consultas.

## Endpoints existentes

| Método | Ruta y parámetros | Permiso | Éxito / respuesta |
|---|---|---|---|
| POST | `/auth/login` | Público | 200 LoginResponse |
| GET | `/profesionales` | T | 200 ProfesionalResponse[] activos |
| GET | `/pacientes?query=` | T | 200 PacienteResponse[] |
| GET | `/pacientes/{id}` | T | 200 PacienteResponse |
| POST | `/pacientes` | A,R | 201 PacienteResponse |
| PUT | `/pacientes/{id}` | A,R | 200 PacienteResponse |
| DELETE | `/pacientes/{id}` | A,R | 204, baja lógica |
| GET | `/agenda?profesionalId=1&fecha=2026-10-19` | T | 200 FranjaResponse[] |
| GET | `/agenda/disponibles?profesionalId=1&desde=2026-10-19T08:00:00` | T | 200 FranjaResponse[] |
| POST | `/agenda/plantillas` | A | 201 PlantillaDisponibilidadResponse |
| POST | `/agenda/generar-franjas` | A | 200 GenerarFranjasResponse |
| POST | `/agenda/excepciones` | A | 201 ExcepcionAgendaResponse |
| POST | `/agenda/bloqueos` | A | 201 ExcepcionAgendaResponse |
| GET | `/configuracion/agenda` | T | 200 ConfiguracionAgendaResponse |
| PUT | `/configuracion/agenda` | A | 200 ConfiguracionAgendaResponse |
| GET | `/turnos?profesionalId=1&fecha=2026-10-19` | T | 200 TurnoResponse[] |
| GET | `/turnos/{id}` | T | 200 TurnoResponse |
| POST | `/turnos` | A,R | 201 TurnoResponse |
| POST | `/turnos/{id}/cancelacion` | A,R | 200 TurnoResponse |
| POST | `/turnos/{id}/reprogramacion` | A,R | 200 TurnoResponse |
| POST | `/turnos/{id}/atencion` | A,M | 200 TurnoResponse, sin cuerpo de entrada |
| POST | `/turnos/{id}/ausencia` | A,M | 200 TurnoResponse, sin cuerpo de entrada |
| GET | `/auditoria` | A | 200 AuditoriaResponse[], últimos 100 |
| GET | `/usuarios` | A | 200 UsuarioResponse[] |
| POST | `/usuarios` | A | 201 UsuarioResponse |
| PATCH | `/usuarios/{id}/activo?activo=false` | A | 200 UsuarioResponse |

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

Duración entera de 5 a 240; horizonte entero de 1 a 365. GET sin fila devuelve 40/90 sin insertar; PUT persiste. No cambia franjas/plantillas existentes ni expone parámetros de días/horas.

### Plantilla semanal

```json
{"profesionalId":1,"diaSemana":"MONDAY","horaInicio":"08:00","horaFin":"20:00","duracionMin":40,"vigenciaDesde":"2026-10-19","vigenciaHasta":null}
```

Día enum MONDAY…SUNDAY; campos obligatorios salvo vigenciaHasta; duración mínima 5 sin máximo declarado en este DTO. Fin posterior a inicio y vigenciaHasta no anterior a vigenciaDesde. El servidor acepta la duración recibida; no impone igualdad con configuración general. El frontend de selección múltiple realiza una llamada por día; no existe endpoint de lote.

### Generación

```json
{"profesionalId":1,"desde":"2026-10-19","hasta":"2026-10-23"}
```

Las fechas son obligatorias; hasta no anterior a desde y no debe superar el horizonte configurado. Respuesta `{creadas, existentes, omitidasPorCierre}`. La repetición secuencial cuenta inicios existentes sin borrarlos. No garantiza resolución de generaciones concurrentes ni de intervalos superpuestos.

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

Tipo obligatorio APERTURA/CIERRE. APERTURA exige ambas horas y duracionMin mínima 5; para CIERRE la duración puede ser null. Se conservan compromisos y se devuelven afectados después de guardar.

### Turnos

Crear:

```json
{"pacienteId":1,"franjaId":10,"motivoConsulta":"Consulta de ejemplo"}
```

Paciente/franja obligatorios, motivo opcional hasta 500. Paciente activo; franja futura y dentro del horizonte, LIBRE y sin otro turno activo.

Cancelar:

```json
{"motivo":"Cambio solicitado por el paciente"}
```

Motivo obligatorio no vacío, máximo 500. Reprogramar:

```json
{"franjaId":11,"motivo":"Nuevo horario coordinado"}
```

Destino obligatorio y distinto del actual; motivo opcional máximo 500; requiere turno activo y franja válida. Atención/ausencia no requieren cuerpo y sólo se admiten a partir del inicio del turno.

### Usuarios

```json
{"email":"recepcion@example.test","password":"CONTRASENA_SEGURA_DE_PRUEBA","rol":"RECEPCION"}
```

Email obligatorio válido y único; password 8–100; rol ADMIN/RECEPCION/MEDICO obligatorio. El alta activa al usuario y guarda BCrypt. PATCH activo usa parámetro de consulta, no un JSON. No hay cambio de contraseña ni de rol expuesto.

## Esquemas de respuesta

| DTO | Campos |
|---|---|
| PacienteResponse | id, dni, nombre, apellido, telefono, email, activo |
| ProfesionalResponse | id, nombre, apellido, matricula, activo |
| FranjaResponse | id, profesionalId, inicio, fin, estado, origen |
| TurnoResponse | id, pacienteId, paciente (apellido/nombre), profesionalId, franjaId, inicio, fin, estado, motivoConsulta, createdAt |
| PlantillaDisponibilidadResponse | id, profesionalId, diaSemana, horaInicio, horaFin, duracionMin, vigenciaDesde, vigenciaHasta |
| ExcepcionAgendaResponse | id, profesionalId, fecha, horaInicio, horaFin, tipo, motivo, franjasCreadas, franjasBloqueadas, turnosAfectados (IDs) |
| ConfiguracionAgendaResponse | duracionEstandarMin, horizonteReservaDias |
| AuditoriaResponse | id, accion, entidad, entidadId, fecha, metadata, usuarioId |
| UsuarioResponse | id, email, rol, activo; nunca passwordHash |

Los horarios libres están limitados por el horizonte y se ordenan por inicio. No aceptan hasta, no generan franjas y no devuelven pacientes. Un desde pasado puede devolver franjas antiguas: pendiente de corrección.

## Errores y límites

El advice de negocio devuelve `{timestamp,status,error,message,path,validationErrors}`. 400 para validación/regla inválida y credenciales incorrectas; 404 para recursos no encontrados; 409 para conflictos explícitos. validationErrors puede ser null o un objeto por campo.

No todos los errores técnicos ni de Spring Security pasan por ese advice. Se comprobó que omitir profesionalId podía terminar en **403** por el tratamiento de errores, aunque el usuario fuese ADMIN. No asumir que todo 403 significa un rol incorrecto ni que todos los cuerpos serán JSON homogéneo. El frontend ya incluye profesionalId en el calendario; falta uniformar el contrato del servidor.

No existen GET de plantillas/excepciones/conflictos, historial de eventos por turno, agenda arbitraria por rango, búsqueda de usuarios por email, alta de profesional, confirmación explícita, notificaciones ni portal público. Distinguirlos de operaciones previstas por el SRS. El [registro de pendientes](pendientes-riesgos.md) indica diferencias y prioridades.
