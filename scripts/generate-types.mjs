#!/usr/bin/env node
/**
 * Regenera src/types/database.generated.ts desde la base Supabase en vivo.
 *
 * Requiere (solo lectura, nunca escribe):
 *   - SUPABASE_ACCESS_TOKEN en el entorno (personal access token, no committear).
 *   - SUPABASE_PROJECT_REF en el entorno (el project-ref operativo está en
 *     docs/operations/PHASE_0_RELEASE_RUNBOOK.md; NO se pone en el repo).
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... npm run types:generate
 *
 * Si faltan variables, no falla de forma ruidosa: explica cómo proceder.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!ref || !token) {
  console.error(
    '[types:generate] Faltan SUPABASE_PROJECT_REF y/o SUPABASE_ACCESS_TOKEN.\n' +
    'El project-ref operativo está en docs/operations/PHASE_0_RELEASE_RUNBOOK.md.\n' +
    'Sin acceso, src/types/database.generated.ts se mantiene desde la fuente local\n' +
    '(ver docs/data/SCHEMA_INVENTORY.md). Ninguna escritura remota se realiza.'
  );
  process.exit(1);
}

const out = execFileSync(
  'npx',
  ['supabase', 'gen', 'types', 'typescript', '--project-id', ref],
  { env: { ...process.env, SUPABASE_ACCESS_TOKEN: token }, encoding: 'utf-8' }
);
writeFileSync('src/types/database.generated.ts', out);
console.log('[types:generate] src/types/database.generated.ts regenerado desde producción (solo lectura).');
