import { sql } from '@vercel/postgres';

async function migrate() {
  console.log('Running database migration...');

  await sql`
    CREATE TABLE IF NOT EXISTS onboarding_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(50) NOT NULL DEFAULT 'new',
      admin_notes TEXT,

      -- Step 1: Business Info
      business_name VARCHAR(255) NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      owner_email VARCHAR(255) NOT NULL,
      owner_phone VARCHAR(50),
      annual_revenue VARCHAR(100) NOT NULL,
      industry VARCHAR(100) NOT NULL,
      industry_other VARCHAR(255),
      employee_count VARCHAR(50),

      -- Step 2: QuickBooks
      qb_version VARCHAR(50) NOT NULL,
      qb_desktop_version VARCHAR(50),
      qb_manager VARCHAR(100) NOT NULL,
      qb_current_state VARCHAR(100) NOT NULL,

      -- Step 3: AR Workflow
      invoice_creation VARCHAR(100) NOT NULL,
      invoice_delivery VARCHAR(100) NOT NULL,
      followup_process VARCHAR(100) NOT NULL,
      followup_frequency VARCHAR(100) NOT NULL,

      -- Step 4: Invoice Volume
      monthly_invoice_count VARCHAR(50) NOT NULL,
      avg_invoice_size VARCHAR(50) NOT NULL,
      current_dso VARCHAR(100) NOT NULL,
      payment_terms VARCHAR(100) NOT NULL,

      -- Step 5: Pain Points
      biggest_ar_pain TEXT NOT NULL,
      biggest_pain_category TEXT NOT NULL,
      nearly_missed_payroll BOOLEAN NOT NULL DEFAULT FALSE,
      biggest_slow_payer VARCHAR(100),

      -- Step 6: Integrations
      uses_stripe BOOLEAN NOT NULL DEFAULT FALSE,
      uses_slack BOOLEAN NOT NULL DEFAULT FALSE,
      uses_google_sheets BOOLEAN NOT NULL DEFAULT FALSE,
      uses_qb_payments BOOLEAN NOT NULL DEFAULT FALSE,
      uses_email BOOLEAN NOT NULL DEFAULT FALSE,
      uses_other TEXT,

      -- Step 7: Modules
      modules_selected TEXT[] NOT NULL DEFAULT '{}',
      target_start_date VARCHAR(50),
      additional_notes TEXT,

      -- ROI fields
      roi_annual_revenue BIGINT,
      roi_current_dso INTEGER,
      roi_working_capital BIGINT,
      roi_wc_released BIGINT
    )
  `;

  console.log('Created onboarding_submissions table');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON onboarding_submissions (created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON onboarding_submissions (status)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_submissions_owner_email ON onboarding_submissions (owner_email)
  `;

  console.log('Created indexes');
  console.log('Migration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
