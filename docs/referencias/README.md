# Referencias y decisiones de origen

Esta carpeta conserva la especificación inicial sin modificar y explica qué información la complementa. El contrato implementado se contrastó con las fuentes del commit `96fc37a`; no se tratan recomendaciones del documento como instrucciones de ejecución.

## Documento inicial

[Especificación inicial](especificacion-inicial.docx): copia íntegra del archivo aportado por el responsable, versión 1.0 del 27 de agosto de 2026, estado borrador para validación y orientación pedagógica. Propone un MVP y fases posteriores. No fija días/horarios reales ni una duración numérica de 40 minutos; contiene ejemplos de miércoles/jueves/viernes.

Se conservan los IDs RF-01…24, RN-01…20 y RNF-01…20 para trazabilidad. El documento tiene contradicciones internas sobre prioridad/momento de aviso de afectados y actores; las decisiones pendientes están en [requisitos](../requisitos.md).

## Correo y confirmaciones comunicadas

El responsable transcribió un correo de Consultora IdS S.A. al doctor: centralizar agenda, registrar pacientes, consultar libres, reservar/cancelar, reutilizar cancelaciones e impedir superposición. Excluye clínica, recetas, pagos/facturación, autogestión y recordatorios automáticos.

También comunicó respuesta afirmativa a duración estándar y conservación de compromisos cuando se suspende atención; agregó reprogramación manual con lista de pacientes/datos de contacto. Finalmente precisó: **lunes a viernes de 08:00 a 20:00 y turnos de 40 minutos**. Se registra como confirmación transmitida por el responsable en esta conversación, no como una nueva respuesta directa obtenida del doctor por el sistema.

La duración es configurable: el responsable aclaró que editarla en frontend y guardarla debe cambiar la persistencia. Por eso 40 se documenta como estándar inicial del consultorio, no como constante inmutable ni como sustituto de un valor ya guardado.

La lista asistida, Fase 2 en el DOCX, se incorpora al alcance necesario según la confirmación actual. No autoriza mensajería automática, llamadas automáticas ni optimización de reprogramaciones.

## Procedencia y versión

[Procedencia de la fuente](origen.json) registra el nombre del documento recibido, fecha, base de código revisada y hash SHA-256 de la copia. Los históricos conservan su contenido; los documentos vigentes corrigen las contradicciones sin alterar el archivo recibido. La reproducción de layout del DOCX no formó parte de este trabajo de documentación Markdown.
