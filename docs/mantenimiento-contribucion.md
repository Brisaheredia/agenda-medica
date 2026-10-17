# Mantenimiento y colaboración

Guía de trabajo para sostener coherencia entre necesidad, código, documentación y prueba. No exige agregar herramientas ni capas que el proyecto no utiliza.

## Cambios de requisitos

Registrar cada pedido como corrección, nueva capacidad, prioridad o incidencia; enlazar RF/RN afectados, origen del pedido y criterio verificable. El SRS inicial es amplio y pedagógico: no convertir sus fases futuras en alcance sin acuerdo. La lista manual de afectados sí fue incorporada por confirmación actual del responsable.

Proponer una tarjeta con problema, comportamiento esperado, criterio de aceptación, responsable, evidencia y commit/PR. El equipo elige Trello o su herramienta; no se verificó un tablero conectado ni se inventan tarjetas ya existentes.

## Código y fan-out

- Mantener controlador orientado a HTTP y servicio orientado a negocio; persistencia en repositorios. Evitar que pantallas repitan políticas de servidor.
- Favorecer responsabilidades cohesivas. Como objetivo inicial, 3–4 colaboradores por servicio y revisión al superar 5; no es una norma universal ni un control automatizado actual.
- Medir colaboradores operativos por separado de DTO/enums/imports. No bajar una cifra mediante fachadas que sólo ocultan el mismo acoplamiento.
- No introducir dependencias circulares. Mantener la transacción del caso de uso completa al extraer responsabilidades.
- En frontend conservar HTTP compartido, separar borrador de configuración confirmada y evitar transferir todo el estado de una pantalla a App por props.
- Evitar consultas por paciente en un bucle de interfaz para la futura lista de afectados; preferir una respuesta orientada al caso de uso.
- Formatear de manera legible y consistente. No agregar pruebas que sólo reflejen asignaciones triviales; cubrir reglas de negocio y regresiones relevantes.

Antes de introducir otro servicio, explicar su responsabilidad, dependencias y cómo reduce decisiones coordinadas. AgendaService y TurnoService son los primeros candidatos de revisión, sin convertir una mejora de interfaz pequeña en una reescritura total.

## Git y revisión

El formato acordado es `Frontend(feat): descripción`, `Frontend(fix): descripción` y `Backend(fix): descripción` o el tipo adecuado. feat agrega una capacidad, fix corrige comportamiento y docs corresponde a documentación. No implica adoptar un estándar externo de nombres.

Separar commits por propósito y módulo cuando los cambios lo permitan. Revisar diff, no incluir secretos, outputs, node_modules ni configuración privada. Ejecutar las verificaciones apropiadas; si una suite queda bloqueada, registrar causa y no declararla aprobada. Evitar reescribir commits ajenos o crear commits vacíos para aparentar cambios.

## Documentación y definición de terminado

Actualizar en el repositorio los documentos que cambian con la implementación: API si cambia contrato, manual si cambia interacción, requisitos/trazabilidad si cambia alcance y pruebas si cambia evidencia. Actualizar README y CHANGELOG con commit/fecha. Mantener históricos fuera del recorrido de uso actual.

Una tarea termina cuando el comportamiento acordado está implementado y revisado, los controles aplicables pasan, la aceptación puede demostrarse y la documentación coincide. Una aprobación visual no sustituye persistencia, permisos o concurrencia.

La documentación se guarda en Git junto al código. Incluir los cambios documentales en la misma entrega funcional o en un commit documental claramente relacionado. Registrar el commit de código revisado y quién aprueba cambios de alcance. El historial de Git conserva versiones anteriores; los documentos de etapas previas se rotulan y agrupan en `docs/historico`. Los gráficos se mantienen en bloques Mermaid editables, sin imágenes generadas que dupliquen el diagrama.

## Gestión de dependencias y deuda

El frontend declara latest y tiene lockfile; usar npm ci para reproducir instalación. Proponer fijar rangos compatibles y agregar lint/runner sólo como tareas explícitas. Backend depende de Maven y tiene cinco tests; falta autonomía de configuración JWT de test. Gestionar migraciones, error HTTP uniforme y configuración de producción como pendientes visibles.

No afirmar ausencia de vulnerabilidades: esta revisión documental no ejecutó un análisis de dependencias ni una auditoría de despliegue. Los defectos confirmados y riesgos identificados se mantienen en [pendientes](pendientes-riesgos.md).
