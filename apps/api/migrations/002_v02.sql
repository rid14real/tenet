-- v0.2: tenant mode (in-house or advisory) and new record types.
ALTER TABLE orgs DROP CONSTRAINT IF EXISTS orgs_kind_check;
UPDATE orgs SET kind = CASE kind WHEN 'dpco' THEN 'advisory' WHEN 'company' THEN 'in-house' ELSE kind END;
ALTER TABLE orgs ALTER COLUMN kind SET DEFAULT 'in-house';
ALTER TABLE orgs ADD CONSTRAINT orgs_kind_check CHECK (kind IN ('in-house', 'advisory'));

ALTER TABLE records DROP CONSTRAINT IF EXISTS records_collection_check;
ALTER TABLE records ADD CONSTRAINT records_collection_check CHECK (collection IN
  ('activities', 'systems', 'vendors', 'assessments', 'incidents', 'requests', 'aiSystems', 'policies', 'trainings', 'tasks'));
