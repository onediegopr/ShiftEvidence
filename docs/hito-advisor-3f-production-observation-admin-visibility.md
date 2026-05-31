# HITO ADVISOR-3F — Production Observation / Admin Visibility / Controlled Activation Management

## 1. Resumen ejecutivo

ADVISOR-3F agrega observabilidad interna para Senior Advisor Methodology Context sin activar cambios productivos ni abrir lanzamiento publico completo.

Estado: COMPLETO.

Veredicto: el contexto metodologico queda visible para operacion admin como runtime flag status, KB health y usage stats agregadas, sin exponer prompts, secretos, contenido crudo de bloques ni evidencia de clientes.

Full public launch: NO declarado.

## 2. Alcance implementado

* Servicio admin read-only para Methodology Context.
* Estado seguro del flag `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
* Health check de Knowledge Base metodologica por IDs, titulos, versiones, estados y exposicion.
* Estadisticas agregadas de uso desde metadata sanitizada de `AiUsageEvent`.
* Pestaña interna en consola admin: Advisor Metodologia.
* Tests unitarios de runtime status, KB health y agregacion segura de uso.

## 3. Runtime status

* Activacion por env flag.
* Default: disabled.
* Solo `true` exacto habilita el contexto metodologico.
* Valores no `true` se reportan como estado seguro, sin devolver el valor crudo.
* No se agregaron toggles ni acciones admin para mutar runtime, Hostinger o env vars.

## 4. KB health

* Se valida el registry existente con `validateMethodologyRegistry`.
* Se reportan conteos de bloques totales, activos, draft, deprecated y restricted.
* Se reportan IDs activos y versiones.
* Se reportan summaries seguros por bloque: id, title, version, status, exposureLevel, domain y lastReviewedAt.
* No se expone `content`, prompts, preview text ni reglas completas.

## 5. Usage stats

* Fuente: `AiUsageEvent` con `operationType = senior_advisor_message`.
* Ventana default: 30 dias.
* Metricas: eventos Advisor, eventos con metadata metodologica, inclusiones, skips, errores, disabled, promedio de bloques, warnings, blocked reasons y top block IDs.
* Solo se usa metadata sanitizada previamente persistida.
* No se exponen prompts, respuestas, cookies, secretos, localStorage, contenido de archivos ni raw customer data.

## 6. Admin visibility

La consola admin suma una pestaña interna de observabilidad:

* estado de activacion controlada;
* salud de KB;
* uso agregado;
* bloques mas usados por ID;
* tabla segura de resumen de bloques.

La vista es read-only. No contiene botones de activacion, deploy, cambio de env vars, migraciones, billing ni provider strategy.

## 7. Seguridad

* No secrets.
* No raw file contents.
* No customer raw evidence.
* No prompt completo.
* No preview completo.
* No contenido crudo de bloques metodologicos.
* No cookies/localStorage.
* No cross-workspace leakage.
* `needs_review` no se trata como hecho.
* No DB schema changes.
* No migraciones.
* No deploy.
* No Hostinger changes.

## 8. Estado final Advisor

* Advisor v1 permanece cerrado operativamente.
* Project Memory Vault permanece cerrado operativamente.
* Methodology Context queda con observabilidad admin basica.
* ADVISOR-3 production readiness mejora por visibilidad interna y control de activacion documentado.
* Full public launch sigue NO declarado.

## 9. Riesgos pendientes

* Smoke real en produccion con sesion admin.
* Activacion productiva controlada si se decide habilitar el flag.
* RAG.
* Embeddings.
* Vector DB.
* Billing real.
* Retention/export/delete.
* Admin visibility avanzada.
* Alerting automatico.
* Full public launch.

## 10. Proximo paso recomendado

Ejecutar ADVISOR-3F-SMOKE si se quiere validar la pestaña admin en un runtime autenticado. Luego avanzar a ADVISOR-3G controlled activation smoke o preparar ADVISOR-3/RAG audit spec, manteniendo RAG y embeddings fuera de este hito.
