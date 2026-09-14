-- Align persisted plan entitlements with the Founder-approved launch model.
-- Free: 5 document units, no bulk. Pro is represented by the legacy `paid` plan id.
-- Business: 1,000 document units, 10,000 bulk document units, API access.
UPDATE plans
SET name = 'Free', monthly_conversion_limit = 5, monthly_bulk_limit = 0, api_access = FALSE
WHERE id = 'free';

UPDATE plans
SET name = 'Pro', monthly_conversion_limit = 100, monthly_bulk_limit = 500, api_access = FALSE
WHERE id = 'paid';

UPDATE plans
SET name = 'Business', monthly_conversion_limit = 1000, monthly_bulk_limit = 10000, api_access = TRUE
WHERE id = 'business';
