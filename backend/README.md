# Backend de Agenda Médica

API REST de pacientes, disponibilidad, turnos, usuarios y auditoría. Código en `backend/`, dentro del repositorio. Base revisada: `96fc37a`, 17 de octubre de 2026.

## Requisitos y ejecución

Java 21, Maven 3 compatible y MySQL 8 accesible. El repositorio no incluye Maven Wrapper: se necesita `mvn` en PATH o configurar Maven en el IDE. Docker sólo es necesario para la suite de integración con Testcontainers, no para ejecutar la aplicación contra un MySQL existente.

Seguir [instalación y variables](../docs/instalacion-configuracion.md) antes de iniciar. Desde la raíz del repositorio:

```powershell
Set-Location backend
mvn spring-boot:run
```

Si Maven no está en PATH, configurarlo o utilizar una instalación disponible desde el IDE. Una ruta de instalación particular no es un requisito del proyecto. Configurar el SDK Java 21, las variables y el directorio de trabajo del módulo en la configuración de ejecución del IDE.

El puerto por defecto del código versionado es 8080 y se puede cambiar mediante configuración de entorno. Utilizar el puerto efectivo de esa instalación. Swagger: `/swagger-ui.html`; esquema JSON: `/v3/api-docs`. Son públicos. El resto de las rutas requiere JWT, salvo login y preflight CORS.

## Organización

| Paquete | Responsabilidad |
|---|---|
| `controller` | Contrato HTTP y validación de entrada |
| `service` | Reglas, transacciones y coordinación |
| `repository` | Acceso JPA a MySQL |
| `domain.entity` / `domain.enums` | Persistencia y vocabulario de estados |
| `dto` | Solicitudes y respuestas sin exponer directamente entidades |
| `security` | Emisión/validación JWT y carga de autoridades |
| `config` | Seguridad, administrador inicial y seed dev |
| `exception` | Errores de negocio y respuestas de validación |

La reserva bloquea una Franja con `PESSIMISTIC_WRITE` dentro de una transacción. La reprogramación conserva el ID de turno y registra origen/destino. No afirmar que ese mecanismo impide intervalos superpuestos entre franjas diferentes: es una limitación pendiente.

## Configuración y datos iniciales

`ConfiguracionAgenda` usa ID 1, duración inicial de 40 minutos y horizonte inicial de 90 días. La BD determina el valor guardado. Si no hay fila, GET devuelve valores iniciales sin insertarlos; PUT crea o actualiza. Cambiar el inicializador no actualiza una fila existente.

`BootstrapAdmin` crea un ADMIN sólo si no existe **ningún usuario** y se definieron email/contraseña de bootstrap. No modifica claves de usuarios existentes. El perfil `dev` crea un profesional, dos pacientes y ocho franjas para el día siguiente; esas franjas siguen siendo de 30 minutos y pueden caer en fin de semana. El seed no representa el horario acordado ni habilita lunes a viernes automáticamente.

## Compilación y pruebas

```powershell
mvn -B test
mvn -B package
```

Ambos requieren que la suite pueda iniciar MySQL por Docker y que JWT tenga una clave válida en test. No usar opciones que omitan tests como evidencia de aprobación. La clase actual tiene cinco escenarios; ver [pruebas](../docs/pruebas-aceptacion.md). No se incluyen migraciones Flyway/Liquibase ni endpoints de administración de profesionales.

Contrato completo, códigos y ejemplos: [API](../docs/api.md). Antes de publicar: [operación](../docs/operacion-respaldo.md) y [pendientes](../docs/pendientes-riesgos.md).
