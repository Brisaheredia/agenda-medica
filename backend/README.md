# Backend de Agenda Médica

API REST de pacientes, disponibilidad, turnos, usuarios y auditoría. Código en `backend/`, dentro del repositorio. Actualizado con origen de cancelación y reprogramaciones, 17 de octubre de 2026.

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

La reserva bloquea una Franja con `PESSIMISTIC_WRITE` dentro de una transacción. Los cambios de un mismo turno también se serializan por bloqueo pesimista. La reprogramación bloquea sus franjas en orden de ID, conserva el ID del turno y registra origen/destino. DisponibilidadService revalida cierres al reservar/liberar; AgendaConsultaService recupera los pendientes con sus contactos. La reserva también comprueba intervalos entre franjas distintas y se serializa con la generación mediante bloqueo del profesional. La generación habilita un mes por operación, siempre con duración fija de 40 minutos y sin modificar citas asignadas.

## Configuración y datos iniciales

`ConfiguracionAgenda` usa ID 1, duración fija de 40 minutos y horizonte inicial de 90 días. Sólo el horizonte es configurable. Si no hay fila, GET devuelve valores iniciales sin insertarlos; PUT crea o actualiza. La columna previa de duración se conserva por compatibilidad: la API siempre expone 40 y rechaza otros valores; al guardar se persiste 40 sin reescribir historia.

`BootstrapAdmin` crea un ADMIN sólo si no existe **ningún usuario** y se definieron email/contraseña de bootstrap. No modifica claves de usuarios existentes. El perfil `dev` crea un profesional y dos pacientes de ejemplo; ya no crea franjas automáticamente. La agenda se habilita explícitamente por mes.

## Compilación y pruebas

```powershell
mvn -B test
mvn -B package
```

La integración requiere MySQL por Docker y define su propia clave JWT exclusiva de test. Hay quince escenarios de integración, nueve pruebas unitarias de agenda y pruebas HTTP de autorización para los cuatro roles; no usar opciones que omitan tests como evidencia de aprobación. Ver [pruebas](../docs/pruebas-aceptacion.md). No se incluyen Flyway/Liquibase ni endpoints de administración de profesionales. Para bases previas con DDL deshabilitado, revisar el [SQL aditivo](sql/2026-10-17-origen-cancelacion.sql); no ejecutarlo si ddl-auto=update ya creó las columnas. No se asigna un origen inventado a cancelaciones históricas.

**Duración fija:** no hace falta la migración mensual propuesta anteriormente. El circuito de cambio de duración y su SQL fueron retirados. La generación limpia sólo franjas futuras libres de otra duración sin turnos/eventos asociados y revierte todo ante conflictos con datos que deban conservarse.

Los permisos se definen en `SecurityConfig` con denegación por defecto. ADMIN, MEDICO, RECEPCION y OBRAS_SOCIALES siguen la [matriz acordada](../docs/roles-permisos.md). Sólo ADMIN administra cuentas; los cambios de contraseña o rol invalidan tokens anteriores y no se permite quitar al último administrador activo. En desarrollo `ddl-auto=update` actualiza la columna de rol; con DDL manual, el esquema debe admitir OBRAS_SOCIALES antes de crear esas cuentas.

Contrato completo, códigos y ejemplos: [API](../docs/api.md). Antes de publicar: [operación](../docs/operacion-respaldo.md) y [pendientes](../docs/pendientes-riesgos.md).
