# AUDITORÍA INTEGRAL — SHIFT EVIDENCE STORAGE / ADVISOR / SUPPORT / LOGIN / CONSOLE COHERENCE

## 1. Executive summary

- **Estado general**: La plataforma **Shift Evidence** (o **ShiftReadiness**) presenta una base arquitectónica sumamente robusta. La separación de responsabilidades entre el frontend de usuario, la consola de administración y los servicios backend de análisis (motores determinísticos de Ceph/Licensing e integraciones de IA) está bien estructurada. La persistencia mediante Prisma y la autenticación local funcionan correctamente. El diseño visual con estética *dark mode/glassmorphism* es premium y moderno.
- **Veredicto**: **Apto para Lanzamiento Beta Limitado**, siempre y cuando se resuelvan brechas menores de consistencia de flujo, se implementen estados de carga (*loading states*) en formularios asíncronos críticos y se formalice la transición de datos del modelo de storage legacy al nuevo.
- **Riesgos críticos**:
  1. **Ausencia de feedback en acciones de IA**: Al ejecutar análisis de IA de Storage o evaluación de Ceph, no hay indicador de carga ni bloqueo de botones. El usuario puede hacer clics repetidos, gastando créditos y provocando colisiones.
  2. **Asimetría de soporte para el usuario**: Los usuarios pueden enviar solicitudes de soporte desde múltiples puntos, pero **no tienen forma de ver el historial o estado de sus solicitudes** en la consola de usuario.
  3. **Consistencia de lenguajes**: La consola de administración está en español (decisión de diseño interna), pero en el dashboard del cliente (en inglés) se muestra un aviso administrativo en español para usuarios administradores.
- **Quick wins**:
  - Incorporar estados de carga en los botones de "Evaluate Ceph suitability" y "Run Storage Analysis" usando `useFormStatus` o similares.
  - Traducir el banner administrativo del dashboard de usuario (`dashboard/page.tsx`) al inglés o adaptarlo dinámicamente según la interfaz del cliente.
  - Modificar `/contact` para que redirija o apunte al formulario de soporte público en lugar de mostrar un error de placeholder.
- **Qué NO tocar**:
  - **Prisma DB Schema / Migraciones**: No realizar modificaciones destructivas ni cambios innecesarios de bases de datos antes del lanzamiento.
  - **Motores determinísticos de Ceph y Licensing**: Mantener sus lógicas intactas ya que son estables y pasan sus respectivas suites de pruebas unitarias.
  - **Capa Core de Autenticación (Better-Auth)**: Su integración y seguridad en el redireccionamiento son correctas y estables.

---

## 2. Mapa real de módulos encontrados

Tras auditar la base de código y base de datos, se identifican las siguientes estructuras reales:

- **Storage**:
  - Modelo de datos estructurado dual: [AssessmentStorageDestinationReadiness](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/prisma/schema.prisma#L403) (nuevas especificaciones Proxmox, HA, PBS, crecimiento, etc.) conviviendo con el modelo legacy [StorageReadinessInput](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/prisma/schema.prisma#L597).
  - Archivos clasificados asociados a través de [AssessmentStorageEvidence](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/prisma/schema.prisma#L458).
  - Lógica analítica en [storageContextAiAnalysisService.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/assessments/storageContextAiAnalysisService.ts) y suitability determinística en [cephSuitabilityEngine.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/assessments/cephSuitabilityEngine.ts).
- **Advisor**:
  - Mapeo de hilos en [AssessmentAdvisorConversation](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/prisma/schema.prisma#L501) y mensajes en [AssessmentAdvisorMessage](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/prisma/schema.prisma#L526).
  - Extracción automática de hechos, decisiones y riesgos a [AssessmentAdvisorMemoryItem](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/prisma/schema.prisma#L560) (Project Memory Vault).
  - Consulta asistida por Base de Conocimiento de Metodología RAG (`advisor-metodologia` en administración).
- **Support**:
  - Entidad centralizada [SupportRequest](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/prisma/schema.prisma#L1115) clasificada por categorías y canales de origen (público / autenticado).
  - Acciones de servidor y validación de seguridad contra fugas de credenciales en [supportRequestService.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/support/supportRequestService.ts).
- **Login / returning user**:
  - Rutas de redirección [/login](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/login/page.tsx) y [/client-login](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/client-login/page.tsx) que derivan según sesión activa a `/dashboard` o `/sign-in`.
  - UI de credenciales limpia en [/sign-in](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/sign-in/page.tsx) orientada a continuidad de workspace.
- **User console**:
  - Panel principal [/dashboard](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/dashboard/page.tsx) con KPIs agregados de evaluaciones y formulario de soporte.
  - Panel de detalle [/dashboard/assessments/[id]](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/dashboard/assessments/[id]/page.tsx) con 9 pestañas de flujo secuencial (Basics, Evidence, Context, Storage, Client-Context, Advisor, Inventory, Report, Support).
- **Admin console**:
  - Consola interna privada [/dashboard/admin](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/dashboard/admin/page.tsx) con 15 pestañas de monitoreo de negocio, consumos de IA, revisión de soporte y administración de storage/Ceph.
- **Public web**:
  - Páginas de conversión: Home `/`, `/about`, `/support` (con inboxes dedicados en `/support#security`), `/pricing`, `/security`, `/partners` y `/contact` (actualmente placeholder). Standalone sales page `/vmware-to-proxmox-readiness` (alias de `/shiftreadiness`).

---

## 3. Storage layer audit

- **Qué existe**: Modelo de datos muy completo para evaluar el destino Proxmox (`AssessmentStorageDestinationReadiness`), con soporte de evidencias específicas clasificadas por tipo (BOM de hardware, diagrama de red, salidas Ceph CLI como `ceph_df` o `ceph_osd_tree`).
- **Cómo fluye internamente**: El usuario introduce sus preferencias de almacenamiento y constraints, opcionalmente sube evidencias técnicas de almacenamiento, y luego ejecuta el análisis de IA que extrae conclusiones cualitativas. Posteriormente, puede gatillar el motor determinístico de idoneidad de Ceph. Todo este conjunto de datos alimenta el reporte y el contexto conversacional del Advisor.
- **UI actual**: Pestaña dedicada con un formulario unificado en [StorageDestinationReadinessPanel.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/components/assessments/StorageDestinationReadinessPanel.tsx) estructurado en dos columnas y sub-secciones para Ceph y carga de archivos.
- **Backend/data flow**: Mapeado mediante transacciones transaccionales en [storageDestinationReadinessService.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/assessments/storageDestinationReadinessService.ts).
- **Scoring/report/PDF impact**: El almacenamiento impacta directamente el score del reporte mediante [storageReadinessScoringService.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/assessments/storageReadinessScoringService.ts), ponderando completitud de campos, confianza de evidencias y riesgos de migración (como snapshots activos o datastores saturados).
- **Problemas**:
  - Incoherencia en el cálculo de completitud del Completion Center, que todavía evalúa campos basándose en el modelo legacy `StorageReadinessInput` en vez del nuevo modelo `AssessmentStorageDestinationReadiness`.
  - Falta de feedback visual e inhabilitación de botones al gatillar Server Actions de IA o Ceph en la UI del panel de almacenamiento.
- **Qué preservar**:
  - La arquitectura de lectura / carga asíncrona de evidencias de storage.
  - El motor determinístico de idoneidad Ceph (`cephSuitabilityEngine.ts`).
  - Las validaciones estrictas de tamaño y límite de palabras definidas en `storageReadinessValidation.ts`.
- **Qué ajustar**:
  - **¿`StorageReadinessInput` debe preservarse, cambiarse o eliminarse?**
    - **Veredicto**: Debe **preservarse** en el esquema para evitar migraciones destructivas antes del lanzamiento beta, pero debe considerarse **obsoleta (deprecated)**. La lógica del Completion Center en `assessmentCompletionService.ts` debe modificarse para evaluar la completitud a través de `AssessmentStorageDestinationReadiness`.
  - **¿Acordeones sí/no?**
    - **Veredicto**: **NO**. Para perfiles técnicos de infraestructura y consultores, es preferible ver todos los campos agrupados de forma tabular y transparente. Los acordeones añaden clics innecesarios y complican la visibilidad y validación del estado del formulario.
  - **¿Storage TCO sí/no?**
    - **Veredicto**: **NO por ahora**. Inventar simulaciones financieras sin datos reales daña la credibilidad técnica. Debe quedar como un "Future Premium Module" sugerido por el Advisor, utilizando notas cualitativas en lugar de un simulador numérico directo.
  - **¿Collector Proxmox/Ceph/PBS sí/no?**
    - **Veredicto**: **Solo especificación de script manual (MVP)**. Proponer en la interfaz un script de shell de una sola línea (ej. `pvesh get /cluster/resources --output-format json`) para que el usuario corra manualmente en sus nodos y suba el archivo JSON resultante como evidencia técnica. Esto mantiene el enfoque agentless y seguro.
  - **¿PDF deep changes sí/no?**
    - **Veredicto**: **NO**. La integración actual del storage en la generación de reportes PDF ya está estructurada y es bastante detallada en [reportStorageDestinationReadinessSection.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/reports/reportStorageDestinationReadinessSection.ts). Solo se sugieren ajustes estéticos de layout y márgenes.

---

## 4. Senior Migration Advisor audit

- **Estado actual**: Excelente implementación del Project Memory Vault que extrae automáticamente ítems de memoria (hechos, decisiones, open questions, etc.) permitiendo al usuario confirmarlos o rechazarlos para contextualizar las siguientes interacciones de la IA.
- **Integración con assessment**: Carga de forma fluida los datos de inventario computados por el parser de RVTools.
- **Integración con storage**: El Advisor recibe de forma nativa todo el bloque de análisis de storage y la idoneidad Ceph en el payload del sistema a través de [seniorAdvisorContextService.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/advisor/seniorAdvisorContextService.ts).
- **Integración con memory/methodology**: Cuenta con soporte para inyección RAG del catálogo de bloques de metodología.
- **UX**: Chat interactivo con panel lateral para gestión de memoria. La interfaz de chat en [SeniorMigrationAdvisorPanel.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/components/assessments/SeniorMigrationAdvisorPanel.tsx) es compacta y premium.
- **Errores/provider states**: Cuenta con lógica de fallback robusta y reintentos automáticos para el proveedor Gemini.
- **Qué preservar**:
  - El panel interactivo de aprobación y rechazo de ítems del Memory Vault.
  - Las reglas estrictas de seguridad de prompt en `seniorAdvisorPrompt.ts`.
- **Qué ajustar**:
  - Agregar un enlace de ayuda rápida dentro del panel del Advisor explicando cómo las decisiones aprobadas en el Memory Vault afectan las respuestas futuras.
- **Admin visibility recomendada**:
  - **Debe incluirse**: El administrador debe poder visualizar estadísticas de uso del Advisor por evaluación (número de mensajes, coste de tokens e ítems de memoria activos), pero **NO debe poder ver el chat completo** del cliente por motivos de privacidad comercial, a menos que el usuario lo autorice explícitamente al abrir un ticket de soporte.

---

## 5. Support/help audit

- **Público**: Formulario en `/support` que recopila email, nombre, empresa, asunto y mensaje, con enrutamiento interno.
- **Usuario autenticado**:
  - En `/dashboard`: Formulario simple integrado que auto-vincula el usuario y el workspace del contexto.
  - En `/dashboard/assessments/[id]?tab=support`: Formulario contextual que asocia de forma directa la evaluación consultada.
- **Admin**: Panel privado de solicitudes en español con filtros por estado, prioridad y campo para guardar notas operativas internas.
- **Seguridad**: Excelente inclusión del filtro `assertNoSecrets` para detectar y bloquear el envío accidental de tokens de API, URLs de bases de datos o contraseñas en los campos de soporte.
- **Gaps**:
  - No existe una vista para que el cliente final vea el histórico de los tickets enviados ni el estado de resolución de sus dudas.
- **Qué preservar**:
  - El sistema de detección y bloqueo de secretos en los mensajes de soporte.
  - La asignación automática de prioridad basada en categorías.
- **Qué mejorar**:
  - Incorporar en el dashboard del usuario un componente simple que liste las solicitudes de soporte anteriores del cliente (Asunto, Categoría, Estado actual y Fecha).
  - Incluir en la tabla de soporte de la consola de administración un enlace directo a la evaluación y el perfil de usuario afectados para acelerar la resolución.

---

## 6. Login / returning user UX audit

- **Header**: Enlace discreto "Client login" en la barra de navegación pública.
- **Footer**: Enlace equivalente en la sección de recursos.
- **Rutas `/client-login` / `/login`**: Redirecciones en el servidor correctas.
- **Sign-in**: Pantalla `/sign-in` estéticamente coherente con microcopy orientado a retomar el workspace.
- **Dashboard continuity**: Buen flujo al ingresar; si el usuario ya está autenticado, las rutas `/login` y `/client-login` lo redirigen de forma transparente al `/dashboard`.
- **Gaps**:
  - Si la redirección desde `/client-login` a `/sign-in` (o `/dashboard`) demora debido a la latencia de red, el usuario ve la página en blanco momentáneamente.
- **Qué preservar**:
  - El uso de alias de rutas en el servidor en lugar de duplicar componentes de login.
- **Qué mejorar**:
  - Mostrar una pantalla con un spinner básico de carga rápida si el servidor tarda en resolver la sesión.

---

## 7. User console flow audit

- **Primer ingreso**: Flujo guiado lógico: Basics -> Evidence (RVTools upload) -> Report.
- **Usuario recurrente**: El `/dashboard` resume de forma clara las evaluaciones activas ordenadas por última actualización para retomar el trabajo fácilmente.
- **Assessment detail**: Pestañas de flujo bien organizadas en la parte superior.
- **Storage / Advisor / Support / Report**: Todo integrado de forma nativa en la misma URL con parámetros `tab`.
- **Gaps and dead ends**:
  - **Duplicación de acciones**: El `/dashboard` contiene una sección de creación de soporte permanente y las evaluaciones individuales también. Esto es correcto por contexto, pero visualmente satura un poco la pantalla principal del workspace.
  - **Falta de feedback visual**: Al hacer clic en "Run Analysis" en la pestaña de storage, no se deshabilita el botón, por lo que el usuario puede creer que no pasó nada y volver a hacer clic.

---

## 8. Admin console audit

- **Qué existe**: Un panel operativo muy robusto, completamente traducido al español en [admin/page.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/dashboard/admin/page.tsx), con KPIs agregados, control de configuraciones operativas, y una pestaña "Storage/Ceph" ya funcional con telemetría en tiempo real.
- **Qué falta**:
  - Un módulo de telemetría o dashboard rápido para el **Senior Advisor** en la consola de administración, que permita monitorizar errores de conexión con el LLM o consumo de créditos de forma centralizada.
  - Capacidad de filtrar la bandeja de solicitudes de soporte (ej. ver solo tickets abiertos o de alta prioridad).
- **Storage visibility recomendada**: Ya está bien cubierta por la pestaña "Storage/Ceph". Se sugiere añadir una columna o tag indicando si el cliente utilizó el script de recolección manual sugerido en el MVP.
- **Advisor visibility recomendada**: Añadir tarjetas de KPIs en la pestaña de IA para ver:
  - Total de conversaciones activas.
  - Tokens de entrada/salida consumidos en las últimas 24 horas.
  - Ratio de errores de la API de Gemini.
- **Support improvements**: Incorporar buscador de texto básico por asunto/email y paginación en la bandeja de tickets para evitar problemas de rendimiento a futuro.

---

## 9. Full-web visual audit

- **Home**: Estética premium muy bien lograda, con diagramas vectoriales interactivos del flujo de migración.
- **About / Support / Pricing / Security / Partners**: Consistencia impecable en las tipografías (Inter) y el esquema de colores.
- **Dashboard / Assessment detail / Admin**: Excelente contraste de tarjetas de fondo translúcido y bordes sutiles.
- **Mobile**: Buen comportamiento adaptativo de los grids, aunque la barra de pestañas horizontales en el detalle de la evaluación puede requerir *scroll* horizontal en dispositivos muy angostos.
- **Typography & Colors**: Uso elegante de cian (`#06b6d4`) y violeta (`#8b5cf6`) sobre superficies oscuras. Los colores de severidad de riesgo y estados están alineados.
- **Density/scanability**: Las tablas internas y paneles de detalles presentan alta densidad de información, pero es adecuada para el perfil técnico del producto.

---

## 10. LangChain-inspired polish, adapted to Shift Evidence

- **Qué tomar**:
  - Jerarquía clara con títulos en fuentes sans-serif de peso pronunciado y labels técnicos pequeños en mayúsculas.
  - Bordes translúcidos con sutiles efectos de brillo al pasar el cursor (*soft border glow*).
  - Micro-interacciones de hover fluidas en botones y tarjetas para dar sensación de aplicación reactiva y premium.
- **Qué NO copiar**:
  - Animaciones excesivamente cargadas o efectos de "magia de IA" que puedan dar una sensación de falta de seriedad o poca transparencia técnica.
- **Hero**: Mantener el flujo interactivo de migración pero optimizar la velocidad de dibujado del SVG en navegadores móviles.
- **Cards**: Usar esquinas redondeadas consistentes (`border-radius: 12px` u `8px`) y sombras internas oscuras para acentuar el efecto de cristal templado.

---

## 11. Inconsistencies, redundancies and dead code candidates

- **Files to inspect / Potential duplicates**:
  - `StorageReadinessInput` en el esquema de Prisma y sus selecciones en `assessmentService.ts`. Representan lógica duplicada con respecto a `AssessmentStorageDestinationReadiness`.
  - El banner administrativo en `src/app/dashboard/page.tsx` está en español, rompiendo la consistencia del idioma inglés del dashboard del usuario final.
- **Risk level**: Bajo a Medio. No impide el despliegue pero afecta la calidad y la percepción del producto.
- **Recommendation**: Planificar la remoción lógica (ignorar a nivel de servicio y migrar consultas) de `StorageReadinessInput` en una fase posterior al despliegue beta público. Corregir inmediatamente los textos en español dentro del área del usuario cliente.

---

## 12. Proposed action plan

### Phase 1 — Safe UX coherence polish (Sin cambios en DB ni APIs)
- **Acción 1**: Implementar estados de carga (`disabled` e indicador de carga de texto) en los formularios asíncronos del panel de almacenamiento (`StorageDestinationReadinessPanel.tsx`).
- **Acción 2**: Corregir el idioma del aviso de acceso administrativo en `src/app/dashboard/page.tsx` para que coincida con el idioma inglés de la consola del cliente.
- **Acción 3**: Modificar la página `/contact` para que sirva de puente hacia el formulario de `/support?category=general_question` en lugar de mostrar un error de placeholder.
- **Acción 4**: Añadir scroll horizontal fluido con indicador visual en la barra de pestañas del detalle de evaluaciones para pantallas móviles.

### Phase 2 — Storage flow consolidation (Preparación de completitud)
- **Acción 1**: Actualizar la lógica del Completion Center (`assessmentCompletionService.ts`) para que el porcentaje y estado del módulo de storage se evalúen a partir de `AssessmentStorageDestinationReadiness` y no del modelo legacy.
- **Acción 2**: Enlazar de forma segura la sugerencia del Advisor sobre el estado de almacenamiento analizado.

### Phase 3 — Optional collector specification (Modelo de datos agentless)
- **Acción 1**: Escribir en la pestaña de almacenamiento de usuario una especificación en Markdown con los comandos CLI recomendados para exportar la configuración técnica de Ceph/Proxmox (para copia rápida y ejecución manual).
- **Acción 2**: Dar soporte a la clasificación automática de archivos JSON exportados bajo esta especificación al ser subidos.

### Phase 4 — Report/PDF incremental storage improvements
- **Acción 1**: Alinear estilos de márgenes y fuentes de las tablas de evidencias y contradicciones de storage en el motor de renderizado PDF.

### Phase 5 — Admin operational cockpit (Telemetría extendida)
- **Acción 1**: Incorporar en la pestaña "IA y Consumo" del administrador el monitoreo de salud del Senior Advisor (contador de errores Gemini, coste acumulado de tokens e histórico de fallbacks).
- **Acción 2**: Añadir paginación y filtro de prioridad en la pestaña de soporte de administración.

---

## 13. Prioritization matrix

| Item / Acción | User impact | Technical risk | Business value | Implementation complexity | Should do | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Loading states en IA/Ceph** | Alto | Muy Bajo | Alto | Baja | **Now** | Evita ejecuciones duplicadas innecesarias y mejora la experiencia de usuario. |
| **Banner Admin en inglés** | Medio | Muy Bajo | Medio | Muy Baja | **Now** | Mantiene la coherencia del lenguaje en la consola del cliente. |
| **Enrutar /contact a soporte** | Medio | Muy Bajo | Medio | Muy Baja | **Now** | Elimina un *dead-end* evidente para usuarios que buscan contacto. |
| **Deprecar StorageReadinessInput**| Bajo | Medio | Bajo | Media | **Later** | Requiere desacoplar lógica en servicios de completitud y test antes de borrar de DB. |
| **Collector Spec en UI** | Medio | Bajo | Alto | Baja | **Later** | Aumenta el valor técnico aportando un método seguro de recolección de evidencias. |
| **Métricas de Advisor en Admin** | Bajo | Bajo | Medio | Media | **Later** | Proporciona herramientas de soporte y costes de infraestructura internas. |

---

## 14. Final recommendation

- **Qué hacer primero**: Resolver los Quick Wins de la Fase 1 (estados de carga en botones de IA de storage, traducción del banner de administración en la vista del cliente, y enrutamiento del placeholder de contacto). Esto dejará el flujo de usuario pulido y libre de incoherencias básicas.
- **Qué posponer**: La eliminación física de `StorageReadinessInput` en la base de datos (DB schema cleanup) y las métricas avanzadas de administración de Advisor. Pueden coexistir de manera segura durante el período de prueba beta.
- **Qué evitar**: Modificaciones complejas en el motor de renderizado de PDF o alteraciones directas de las API de Better Auth que puedan retrasar el demo público.
- **Decisión del usuario requerida**: Confirmar si las solicitudes de soporte anteriores del usuario final deben mostrarse en el dashboard principal o si se mantendrá el enfoque de flujo de soporte unidireccional por correo electrónico para la fase de demo.

¿La plataforma está lista para beta/public demo? **Sí**, una vez aplicados los ajustes visuales y de carga de la Fase 1, la consistencia narrativa y el nivel de detalle técnico son idóneos para una presentación pública de alto nivel.
