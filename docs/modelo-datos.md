# Modelo de datos inicial

## Entidades

### Usuario
Opera el sistema y permitirá auditar acciones críticas.

### Paciente
Datos mínimos de identificación y contacto. La baja será lógica mediante `activo=false`.

### Profesional
Profesional asociado a la agenda. El MVP opera con uno solo, pero el modelo conserva la relación para permitir evolución.

### PlantillaDisponibilidad
Regla recurrente semanal con día, horario, duración y vigencia.

### ExcepcionAgenda
Apertura o cierre excepcional para una fecha o período concreto.

### Franja
Slot materializado de agenda. Tiene profesional, inicio, fin, estado y origen. Se utiliza `@Version` y, al reservar, bloqueo pesimista de fila.

Estados iniciales:

- `LIBRE`
- `OCUPADA`
- `BLOQUEADA`

### Turno
Compromiso entre paciente, profesional y franja. Copia inicio y fin para mantener el compromiso temporal explícito.

Estados iniciales:

- `RESERVADO`
- `CONFIRMADO`
- `CANCELADO`
- `ATENDIDO`
- `AUSENTE`

### TurnoEvento
Registra creación, confirmación, cancelación, reprogramación, atención y ausencia. Permite conservar franja anterior/nueva cuando corresponda.

### Auditoria
Trazabilidad general de operaciones críticas.

## Regla de doble reserva

La prevención de doble reserva se resuelve en la capa de negocio dentro de una transacción:

1. se recupera la `Franja` con `PESSIMISTIC_WRITE`;
2. se verifica que su estado sea `LIBRE`;
3. se verifica que no exista un turno activo asociado;
4. se crea el turno;
5. se cambia la franja a `OCUPADA`;
6. se registra el evento de creación;
7. se confirma la transacción.

Si otra transacción intenta reservar la misma franja, deberá esperar el bloqueo y luego encontrará la franja ocupada, produciendo `409 Conflict`.

No se utiliza una restricción única permanente entre `Turno` y `Franja`, porque una franja liberada por cancelación podrá volver a utilizarse manteniendo el turno cancelado como historial.
