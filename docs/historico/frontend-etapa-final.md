> Documento histórico. Consultar la [documentación vigente](../README.md) antes de utilizar estas instrucciones.

# Etapa final del frontend

El frontend actual de Agenda Médica queda definido como la interfaz final del proyecto de ingeniería, luego de probar el nuevo diseño y decidir conservarlo para la entrega y presentación. Esta etapa consolida la agenda diaria y las pantallas de gestión dentro de una misma aplicación.

La versión vigente se encuentra en la carpeta `frontend`. Este documento actualiza el alcance descrito en [Primera etapa del frontend](frontend-etapa1.md): Pacientes, Disponibilidad, Bloqueos y excepciones, y Auditoría ya cuentan con pantallas implementadas.

## Qué incluye

- Acceso con correo y contraseña, sesión JWT y acciones según el rol.
- Menú con Agenda, Pacientes, Disponibilidad, Bloqueos y excepciones, y Auditoría.
- Cabecera con el profesional, la sesión activa y la opción de cerrar sesión.
- Diseño común entre pantallas, con adaptación a escritorio y móvil.
- Mensajes de carga, confirmación, error, falta de permisos y sesión vencida.
- Modo de demostración con datos ficticios para recorrer la aplicación.

## Agenda diaria y gestión de turnos

La agenda permite consultar una fecha, avanzar o retroceder un día, volver a hoy y actualizar los datos. Presenta los horarios en orden cronológico y un resumen de franjas del día, horarios disponibles para reservar y turnos activos.

Los filtros incluyen disponibles, reservados, atendidos, ausentes, bloqueados y cancelados. Los turnos en estado `CONFIRMADO` se muestran junto con los reservados. El indicador de disponibles cuenta únicamente las franjas libres cuyo inicio sea futuro.

Desde la agenda se puede:

- Elegir una franja libre futura y asignar un turno.
- Buscar un paciente o registrar uno nuevo durante la reserva.
- Indicar el motivo de consulta.
- Cancelar un turno con motivo y conservar su registro visible.
- Reprogramar un turno seleccionando otra fecha y una franja disponible.
- Marcar un turno como atendido o ausente desde su horario de inicio, según el rol.

Los diálogos solicitan confirmación antes de aplicar las acciones. Durante el guardado se deshabilitan controles para evitar envíos repetidos. Ante un conflicto HTTP 409 en las operaciones de turnos, se informa el problema y se actualiza la agenda para elegir otro horario.

## Pacientes

La pantalla permite buscar por DNI o apellido y consultar el listado con los datos de contacto. Administración y Recepción pueden crear pacientes, editar sus datos y desactivarlos con confirmación.

La desactivación se presenta como una baja lógica: el paciente deja de aparecer en las búsquedas, conservando su historial de turnos.

## Disponibilidad

Administración puede crear plantillas semanales indicando el día de atención, el horario de inicio y fin, la duración de cada turno y el período de vigencia.

Luego puede generar franjas para un rango de fechas. El resultado informa cuántas fueron creadas, cuántas ya existían y cuántas se omitieron por cierres. La generación conserva las franjas existentes y respeta los cierres configurados.

## Bloqueos y excepciones

Administración puede bloquear un día completo o un intervalo horario, con un motivo opcional. También puede crear una apertura extraordinaria indicando fecha, horario y duración de los turnos.

La pantalla informa las franjas creadas o bloqueadas y los identificadores de los turnos activos afectados. Estos turnos requieren tratamiento manual; el bloqueo no implica su cancelación automática.

## Auditoría

Administración puede consultar los eventos recientes registrados por el sistema, actualizar la lista y filtrar por acción, entidad, identificador o detalle.

Cada evento muestra su fecha y hora, la entidad asociada y, cuando están disponibles, el usuario y los datos complementarios.

## Roles y permisos

| Operación | ADMIN | RECEPCION | MEDICO |
| --- | --- | --- | --- |
| Consultar agenda y pacientes | Sí | Sí | Sí |
| Crear, editar y desactivar pacientes | Sí | Sí | No |
| Reservar, cancelar y reprogramar turnos | Sí | Sí | No |
| Registrar atención o ausencia | Sí | No | Sí |
| Administrar disponibilidad, bloqueos y excepciones | Sí | No | No |
| Consultar auditoría | Sí | No | No |

La interfaz adapta las acciones al rol de la sesión y el backend aplica la autorización sobre las operaciones. Una respuesta HTTP 401 cierra la sesión activa; una respuesta HTTP 403 informa que el usuario no tiene permisos.

## Organización e integración

El frontend utiliza React, TypeScript y Vite. Su estructura principal es:

- `src/App.tsx`: sesión, selección de pantallas y coordinación de la agenda.
- `src/pages`: pantallas de acceso, agenda y módulos de gestión.
- `src/components`: diseño compartido, formularios, lista de turnos y diálogos.
- `src/hooks`: navegación y carga de datos de la agenda.
- `src/api.ts`: solicitudes HTTP, token de autenticación y manejo de errores.
- `src/demo.ts`: operaciones con datos ficticios en memoria.
- `src/types.ts`: tipos compartidos, estados y utilidades de fecha.
- `src/styles.css`: identidad visual y adaptación a distintos tamaños de pantalla.

La API se configura mediante `VITE_API_URL`. Si no se define, se utiliza `http://localhost:8080`. Vite está configurado para iniciar el servidor de desarrollo en el puerto `5173`.

En el modo real, la aplicación consume los servicios del backend Spring Boot, con autenticación JWT, autorización por roles y persistencia en MySQL mediante JPA e Hibernate.

## Diseño y accesibilidad

Se conserva una estructura visual común con menú lateral, cabecera, tarjetas, iconos y etiquetas de estado. La agenda reúne los controles de fecha, los indicadores, los filtros, la lista de horarios y el panel de reserva.

La implementación incluye etiquetas en controles, foco visible para navegación con teclado, avisos de estado y diálogos nativos. Estos recursos forman parte de la interfaz; no representan una certificación formal de accesibilidad.

## Modo interactivo de demostración

Desde el acceso se puede elegir **Probar con datos de ejemplo**. No requiere credenciales, backend ni base de datos. La demostración utiliza una sesión `ADMIN` ficticia y un almacén separado en memoria, sin enviar las operaciones al backend.

Permite recorrer la agenda y los módulos de gestión con pacientes, horarios y turnos ficticios. Los cambios duran hasta recargar o reiniciar los ejemplos. **Salir de la demostración** vuelve al flujo de sesión real y conserva la sesión real previamente guardada.

### Recorrido sugerido para la presentación

1. Ingresar a la demostración y mostrar la agenda, las fechas y los filtros.
2. Buscar un paciente y reservar una franja disponible.
3. Reprogramar una reserva y cancelar otra indicando el motivo.
4. Consultar una fecha pasada para mostrar el registro de atención o ausencia.
5. Mostrar el alta, la edición y la desactivación de pacientes.
6. Recorrer las plantillas semanales, la generación de franjas, los bloqueos y las aperturas extraordinarias.
7. Consultar Auditoría y explicar la diferencia entre el modo de ejemplo y el uso con datos persistentes.

## Alcance del cierre

El cierre de esta etapa establece el frontend actual como interfaz final para la entrega académica. Se toma el primer profesional activo informado por la API, de acuerdo con el alcance de consultorio individual. No se incorpora un selector operativo de múltiples profesionales, historia clínica, facturación ni notificaciones automáticas.

## Validación de la entrega

La aceptación del diseño surge de la prueba del nuevo frontend y de la decisión de conservarlo como página final. La revisión del código confirma la presencia de las pantallas y flujos documentados; no constituye un acta de pruebas integrales.

Para registrar la validación funcional de la entrega, corresponde comprobar con el backend activo la persistencia al recargar, los permisos de cada rol, los conflictos de reserva y el vencimiento de sesión. La publicación en un servidor se verifica por separado.

## Estado actual del sistema

Las funcionalidades definidas para esta etapa se encuentran implementadas. A partir de este punto, el trabajo se orienta a la validación integral del sistema, corrección de posibles errores, pruebas finales y preparación para su despliegue.

### Mejoras funcionales

#### Búsqueda de pacientes por teléfono o correo

Ampliar la búsqueda de pacientes para permitir consultas por teléfono o correo electrónico, además de DNI y apellido. La mejora debe contemplar tanto la pantalla de Pacientes como la búsqueda utilizada al asignar turnos, junto con el soporte correspondiente en la API.

Para validar su incorporación, comprobar que un paciente pueda encontrarse por cada uno de los cuatro criterios y que la búsqueda actual por DNI y apellido siga funcionando.

#### Calendario de feriados

Incorporar un calendario de feriados para excluir automáticamente esos días de la generación de disponibilidad. Por ahora, los días no laborables se cargan manualmente como bloqueos.

Definir el calendario aplicable al consultorio y cómo se mantendrá actualizado. Al incorporarlo, verificar que no se generen franjas reservables en las fechas excluidas y que los turnos ya existentes se informen para su tratamiento, sin cancelarlos automáticamente.

### Operación y despliegue

#### Copias de seguridad y restauración

Documentar un procedimiento para crear copias de seguridad de la base de datos y restaurarlas. Establecer la frecuencia de las copias, su ubicación, la retención y quién será responsable de realizarlas y verificar su recuperación.

Probar una restauración en un entorno separado y registrar la fecha, la copia utilizada y el resultado. Comprobar la recuperación de pacientes, turnos, disponibilidad y auditoría. Este punto se considera resuelto cuando el procedimiento esté documentado y la restauración se haya probado satisfactoriamente.

#### Configuración segura de producción

Preparar una configuración de despliegue separada de la utilizada para desarrollo. Asegurar HTTPS para el acceso al frontend y a la API, configurar `VITE_API_URL` con la dirección de producción y restringir CORS a los orígenes autorizados del frontend, evitando permisos generales para cualquier origen.

Antes de publicar, verificar el certificado HTTPS, el acceso y las operaciones desde el origen autorizado, y que las solicitudes del navegador desde un origen no autorizado no reciban permiso CORS. Registrar la configuración aplicada y el resultado de estas verificaciones.

Fecha de documentación: 15 de octubre de 2026.
