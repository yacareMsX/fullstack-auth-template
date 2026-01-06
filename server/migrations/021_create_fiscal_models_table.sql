-- Create fiscal_models table to store statutory declarations
CREATE TABLE IF NOT EXISTS fiscal_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    model_type VARCHAR(50) NOT NULL,
    -- e.g., '303', '349', '202'
    year INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL,
    -- e.g., '1T', '2T', '01', '12'
    status VARCHAR(20) DEFAULT 'DRAFT',
    -- 'DRAFT', 'COMPLETED', 'SUBMITTED'
    data JSONB,
    -- Stores the form data efficiently
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure a user can't have duplicate models for same period/type (unless we want versioning later)
    -- For now, let's allow multiple drafts or enforce uniqueness. 
    -- Typically, you have one active declaration per period.
    CONSTRAINT unique_model_per_period UNIQUE (user_id, model_type, year, period)
);
CREATE INDEX idx_fiscal_models_user ON fiscal_models(user_id);
CREATE INDEX idx_fiscal_models_type_period ON fiscal_models(model_type, year, period);