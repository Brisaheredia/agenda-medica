# Revisión de la documentación

Base: commit `96fc37a`, 17 de octubre de 2026. Se revisaron fuentes, documentos existentes, contratos de controladores/DTO, configuración versionada, variables públicas locales, interfaz y evidencias de esta conversación.

## Controles de entrega

- Estructura con README general, frontend/backend y navegación temática por audiencia.
- Enlaces relativos internos comprobados por el generador; cercos de código Markdown balanceados y ejemplos JSON parseables.
- Tabla API con los 26 endpoints declarados por los ocho controladores; verificación automática de coincidencia de método/ruta.
- Catálogo de los 24 RF y matriz de los 20 RNF, diferenciando plan de aceptación de evidencia ejecutada.
- Especificación de referencia copiada sin cambios y verificada por SHA-256; documentos de etapas anteriores eliminados del árbol de trabajo y enlaces actualizados.
- Ausencia de claves locales reales en los documentos vigentes. Los ejemplos de secretos son placeholders o entrada interactiva.
- Puertos generales 8080/3306 y rutas relativas en ejemplos; sin publicar configuración personal.
- Documentación incorporada al repositorio por decisión actual del responsable; se revisan diff y alcance del commit.
- Diagramas de arquitectura, reserva, entidades y estados escritos en Mermaid. Se revisa su sintaxis; no se declara una renderización no realizada.

## Límites

No se ejecutó una nueva aceptación E2E ni restauración de BD; tampoco pruebas de carga, accesibilidad formal o despliegue. No hay conformidad certificada con una norma. Las compilaciones y pruebas previas se describen con su alcance en [pruebas](pruebas-aceptacion.md), sin transformarlas en resultados nuevos.

El árbol de trabajo conserva las guías vigentes y la fuente de requisitos; los documentos obsoletos se consultan únicamente en el historial de Git. Al cambiar código, revisar enlaces, API, manual, alcance y evidencias junto con el commit de referencia.
