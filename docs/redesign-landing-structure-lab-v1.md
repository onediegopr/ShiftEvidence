# REDESIGN-1 - Landing Structure Laboratory Preview

## Objetivo

Crear una ruta laboratorio para evaluar una reorganizacion suave de la landing de Shift Evidence / ShiftReadiness sin reemplazar la home real ni tocar produccion.

## Que se creo

- Ruta laboratorio: `/preview/landing-structure-v1`
- Componente nuevo: `src/components/preview/LandingStructureLabPage.tsx`
- Estilos namespaced: `landing-lab-*` en `src/index.css`

## Que NO se toco

- No se reemplazo `/`.
- No se modifico `/shiftreadiness`.
- No se tocaron rutas reales de `/demo`, `/demo/replay`, `/demo/workspace`, `/sample-report` ni `/pricing`.
- No se tocaron billing, auth, DB, Prisma schema, env vars, storage, Stripe, Wise, R2, Neon, Vercel, Hostinger, DNS ni deploy.

## Secciones incluidas

- Hero reorganizado con CTAs claros.
- Hero v1.1 con titulo mas compacto, mensaje de consultoria senior, IA asistida y preguntas guiadas.
- Placeholder premium con movimiento CSS, luces tenues, senales de workflow y cockpit mas compacto.
- Trust strip compacto.
- `What you will see in 90 seconds`.
- Problema principal.
- Caminos principales de exploracion.
- How it works.
- What you receive.
- Evidence-based, not magic.
- Before / After.
- Sample Report.
- Pricing preview.
- FAQ esencial.
- CTA final.

## Decisiones de copy

- Se reemplazo el primer mensaje por una version mas compacta: `Know what can break before the VMware exit.`
- Se reforzo que RVTools es solo el punto de partida; el valor real esta en discovery, contexto, analisis IA y criterio consultivo senior.
- Se mantuvo el tono premium y conservador.
- Se separaron rutas por intencion: tour, demo workspace, sample report, RVTools y pricing.
- Se evito prometer migracion automatica, acceso productivo o certeza sin evidencia.

## Riesgos

- El preview reutiliza CSS global y puede requerir pulido visual tras QA en navegador real.
- La pagina es completa, no corta; el objetivo es ordenar profundidad, no reducir agresivamente.
- El placeholder de hero no representa todavia el futuro loop animado definitivo.

## Como comparar con la landing actual

- Landing actual local: `/`
- Landing laboratorio: `/preview/landing-structure-v1`
- Revisar jerarquia de CTAs, claridad del primer viewport, orden de secciones, densidad visual y confianza percibida.

## Proximos pasos sugeridos

- `REDESIGN-2 - Hero Product Loop Laboratory Preview`
- Crear un loop visual propio con UI sintetica/real de Shift Evidence, sin video externo ni iframe.
- Validar desktop/mobile con capturas.

## Rollback

Si no se aprueba el laboratorio, eliminar:

- `src/app/preview/landing-structure-v1/page.tsx`
- `src/components/preview/LandingStructureLabPage.tsx`
- bloque CSS `REDESIGN-1 landing structure lab preview`
- `docs/redesign-landing-structure-lab-v1.md`
