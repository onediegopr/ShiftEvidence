# Methodology Bible Extraction Plan

This plan is a safe internal checklist for extracting the full Methodology Bible incrementally.
It is intentionally source-controlled and read-only for now.

## Goals

- Keep the current v2.1 seed as the source of truth.
- Split the future full Bible into deterministic parts.
- Avoid mixing extraction with production behavior changes.
- Make every chunk, rule and domain traceable back to a section of the Bible.

## Current METHODOLOGY-3 status

- The initial expansion wave has already moved the seed from 16 active rules to 69 active rules and 33 active chunks.
- The current active bridge prep is helper-only: Advisor and PDF helpers can build methodology context, but they stay behind explicit feature flags or manual wiring.
- No external embeddings or vector search are used.
- No automatic scoring change is introduced by the extraction plan itself.

## Extraction map

- Part 0 - Fundamentos y gobernanza
- Part I - Moat metodológico
- Part II - Sistema de scoring
- Part III - Recolección de evidencia y baselining
- Part IV - Evaluación VMware
- Part V - Evaluación Proxmox VE
- Part VI - SAN / Storage
- Part VII - Networking
- Part VIII - Aplicaciones y dependencias
- Part IX - Readiness destino
- Part X - Ejecución de migración

## What each part should produce

- One or more methodology domains when needed.
- A stable set of topics.
- Deterministic rule codes.
- Knowledge chunks suitable for local search and later RAG wiring.
- Change-log entries that explain why the content exists.

## Recommended extraction order

1. Lock the governance and scoring language.
2. Extract VMware, Proxmox and storage evidence rules.
3. Add networking and application dependency coverage.
4. Finish readiness, execution and rollback rules.
5. Only after the previous steps, expand the PDF/report language and advisor prompts.
6. Keep the bridge prep helper-only until the review path is explicitly approved.

## Safety notes

- Do not pull real customer evidence into the seed.
- Do not activate external embeddings yet.
- Do not make production scoring depend on unreviewed extracted text.
- Keep notes and review items auditable before they are editable.

## Suggested future deliverable

- A script or generator that reads the Bible sections and produces seed files, docs and review items from a single source.
- A controlled bridge layer that only becomes active behind feature flags and fallback-safe guards.
