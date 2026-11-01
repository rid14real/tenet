-- v0.3: implementation state of Open Privacy Programme Framework controls.
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_collection_check;
ALTER TABLE records ADD CONSTRAINT records_collection_check CHECK (collection IN
  ('activities', 'systems', 'vendors', 'assessments', 'incidents', 'requests', 'aiSystems', 'policies', 'trainings', 'tasks', 'controls'));
CREATE UNIQUE INDEX IF NOT EXISTS records_control_unique ON records (workspace_id, (data->>'controlId')) WHERE collection = 'controls';
