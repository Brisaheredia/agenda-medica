# Revisión de la documentación

Revisión documental del 29 de octubre de 2026, actualizada el 3 de noviembre de 2026 para incorporar obras sociales, permisos y agenda compartida. Se revisaron fuentes, documentos existentes, contratos de controladores/DTO, configuración versionada, variables públicas locales, interfaz y evidencias de esta conversación.

## Controles de entrega

- Estructura con README general, frontend/backend y navegación temática por audiencia.
- Enlaces relativos internos comprobados por el generador; cercos de código Markdown balanceados y ejemplos JSON parseables.
- La tabla API se revisó contra controladores del estado actual; el POST de apertura extraordinaria se retiró y la consulta histórica GET se conserva. Los contratos deben verificarse otra vez después de integrar el cambio.
- Catálogo de los 24 RF históricos y matriz de 20 RNF de referencia; se documentan además decisiones funcionales del equipo (obra social opcional, permisos y actualización), diferenciando lo implementado de lo aceptado.
- Especificación de referencia copiada sin cambios y verificada por SHA-256; documentos de etapas anteriores eliminados del árbol de trabajo y enlaces actualizados.
- Ausencia de claves locales reales en los documentos vigentes. Las cuentas públicas de prueba se identifican como exclusivas de desarrollo; los secretos de cada instalación se configuran por separado.
- Puertos generales 8080/3306 y rutas relativas en ejemplos; sin publicar configuración personal.
- Documentación incorporada al repositorio por decisión actual del responsable; se revisan diff y alcance del commit.
- Diagramas de arquitectura, reserva, entidades y estados escritos en Mermaid. Se revisa su sintaxis; no se declara una renderización no realizada.

## Límites

No se ejecutó una nueva aceptación E2E ni restauración de BD; tampoco pruebas de carga, accesibilidad formal o despliegue. No hay conformidad certificada con una norma. Los resultados históricos de pruebas se describen con su alcance en [pruebas](pruebas-aceptacion.md). Se adecuaron referencias obsoletas de pruebas existentes, pero la suite vigente **no se ejecutó ni se certificó** sobre estos cambios.

El árbol de trabajo conserva las guías vigentes y la fuente de requisitos; los documentos obsoletos se consultan únicamente en el historial de Git. Al cambiar código, revisar enlaces, API, manual, alcance y evidencias junto con el commit de referencia.

## Control de consistencia de los cambios del 2–3 de noviembre

Se revisaron las rutas `/api/obras-sociales`, POST `/api/pacientes` para Obras Sociales, campos opcionales `obraSocialId`/`obraSocialNombre`, límites de reprogramación y la presentación de motivos. Manual, permisos, requisitos, API, modelo de datos, trazabilidad e instalación se actualizan juntos. Este control **no equivale a ejecución de pruebas**, aceptación del cliente ni certificación de compilación.
