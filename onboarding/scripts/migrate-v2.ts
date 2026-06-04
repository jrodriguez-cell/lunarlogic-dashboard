import { sql } from '@vercel/postgres';

async function migrate() {
  console.log('Running migration v2: adding gap_analysis, proposal_draft, analysis_generated_at columns...');

  await sql`
    ALTER TABLE onboarding_submissions
      ADD COLUMN IF NOT EXISTS gap_analysis JSONB,
      ADD COLUMN IF NOT EXISTS proposal_draft TEXT,
      ADD COLUMN IF NOT EXISTS analysis_generated_at TIMESTAMPTZ
  `;

  console.log('Migration v2 complete.');
}

migrate().catch((err) => {
  console.error('Migration v2 failed:', err);
  process.exit(1);
});
