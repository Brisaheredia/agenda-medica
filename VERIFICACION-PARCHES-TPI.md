# Ajustes y verificación — Agenda Médica

Cambios basados en el ZIP recibido del 29/10/2026. No reemplazan el repositorio en GitHub: hay que aplicar los cambios y subirlos.

## 1. Funciones incorporadas

- **Obras Sociales** puede crear pacientes desde **Agenda > Asignar turno > Nuevo paciente**. No puede editar ni desactivar pacientes existentes ni abrir el listado completo.
- **Obra social del paciente**: se elige en el formulario mediante un selector opcional. La opción **+ Agregar nueva obra social** permite crearla ahí mismo y dejarla seleccionada. Puede dejarse vacío para particular. Recepción/Administración ven el dato en Pacientes.
- **Agenda compartida**: las vistas diaria, semanal y por rango se vuelven a consultar al recuperar el foco, al volver a mostrar la pestaña y cada 30 segundos mientras la pestaña está visible. Si otro usuario ocupa la franja seleccionada, se descarta esa selección. La confirmación también revalida en el backend.
- **Obras Sociales** puede reprogramar turnos **activos y no afectados por cierres**, pero NO recuperar los cancelados por el consultorio ni reprogramar turnos de una jornada suspendida; eso queda a cargo de Recepción y Administración. La regla se comprueba en el servicio, no sólo en la pantalla.

## 2. Base de datos

El modelo incorpora `obras_sociales` y la columna opcional `pacientes.obra_social_id` (clave foránea). Los pacientes existentes permanecen sin obra social cargada hasta que se editen.

**Primero respaldar la base.** En el proyecto, `spring.jpa.hibernate.ddl-auto=update` está activo por defecto: al iniciar el backend con ese valor, Hibernate puede crear la tabla y columna. **No ejecutes además el SQL después de que Hibernate haya aplicado el cambio**, porque intentará agregar de nuevo la columna. Si usás `DDL_AUTO=validate` o `none`, ejecutá una sola vez `backend/sql/2026-11-02-obras-sociales.sql` ANTES del arranque. No hay datos reales de obras sociales cargados automáticamente.

## 3. Prueba manual obligatoria: dos usuarios simultáneos

Usar dos sesiones aisladas (por ejemplo Chrome normal e incógnito; dos pestañas del mismo perfil comparten la misma sesión de la aplicación).

1. Iniciar **Recepción** en el navegador A y **Obras Sociales** en el B.
2. En A, registrar un paciente de prueba y seleccionar un horario futuro libre (sin confirmarlo todavía).
3. En B, registrar otro paciente de prueba, elegir exactamente la misma fecha y el mismo horario y confirmar el turno.
4. En A, **sin recargar**, intentar confirmar el horario que todavía estaba seleccionado.
5. **Esperado:** sólo una reserva queda confirmada, y la otra solicitud recibe un conflicto y actualiza la agenda. No hay superposición de turnos.
6. En B, cancelar ese turno con origen **PACIENTE**. En A volver a enfocar la pestaña (o esperar hasta 30 segundos). **Esperado:** el horario vuelve a aparecer disponible, salvo que exista una suspensión/cierre.
7. Volver a reservar el horario desde A. B debe verlo ocupado luego de enfocar/actualizar. Tomar capturas antes y después para la entrega de Pruebas.

**Ojo:** esta no es una conexión por WebSocket en tiempo real. Actualiza por foco y hasta cada 30 segundos. Si se intenta confirmar un horario obsoleto antes de la siguiente actualización, la API debe rechazarlo igualmente.

## 4. Prueba manual: paciente, obra social y permisos

1. Con **Obras Sociales**, entrar en Agenda y hacer clic en **Nuevo paciente**.
2. En Obra social elegir **+ Agregar nueva obra social**, escribir por ejemplo `Obra social de prueba 1` y agregarla.
3. Completar DNI único, nombre y apellido; guardar. El paciente debe quedar seleccionado para asignar turno.
4. Ingresar con **Recepción** y comprobar que el paciente aparece en la lista con su obra social. Editarlo para comprobar que el selector conserva el valor.
5. Intentar registrar dos obras sociales con el mismo nombre: la segunda debe devolver un conflicto, no duplicarla.
6. Con Obras Sociales, confirmar que NO se puede editar/desactivar pacientes ni administrar usuarios.
7. Con Recepción o Administración, crear un turno y cancelarlo con origen **CONSULTORIO**. Como Obras Sociales, intentar invocar `POST /api/turnos/{id}/reprogramacion` para ese turno con credenciales válidas: **403**. La recuperación sí debe quedar permitida a Recepción/Administración.

## 5. Prueba de suspensión

La suspensión de jornada **ya fue comprobada manualmente por el equipo**. No hace falta repetirla para estos cambios. Conservar la captura o registrar ese caso en la próxima etapa de Pruebas.

## 6. Pruebas automáticas disponibles

Desde `backend/`, con Maven y Docker disponibles:

```bash
mvn test -Dtest=AutorizacionHttpTest,TurnoServicePermisosTest
mvn test -Dtest=TurnoAgendaIntegrationTest
```

La segunda usa Testcontainers/MySQL y requiere Docker iniciado. Desde `frontend/`: `npm ci && npm run build && npm test`.

**Importante:** en el entorno donde se preparó este parche no se ejecutaron las suites completas: no hay Maven instalado y `npm ci --offline` no encontró las dependencias de Vite en caché. Estos pasos quedan por verificar en la computadora del equipo.

## 7. Alcance de este parche

La relación es **una obra social actual opcional por paciente**, no un historial de afiliaciones ni una relación entre cada turno y una obra social. No se cargan convenios, coberturas ni facturación. Es intencional para este TPI.

## 8. Presentación de obra social y motivo de consulta (segundo parche)

- Registrar un paciente con obra social y otro sin ella. En una agenda con turnos de ambos, el nombre se muestra sólo para quien tiene obra social.
- Confirmar que un turno sin motivo de consulta **no** muestra «Sin motivo informado». Con Recepción/Administración, un motivo cargado aparece como «Motivo de consulta». Obras Sociales no ve ni puede enviar ese motivo al reservar.
- Verificar la presentación en día, semana, rango, diálogo del turno, historial y Reprogramaciones, siempre según el permiso de cada pantalla.

Ambos parches y esta documentación pueden agruparse en **un único commit** una vez comprobados los cambios.
