-- Rollback for 0001_create_leads. Destructive — drops all lead data.
-- Run manually and deliberately; never auto-run on startup or deploy.
DROP TABLE IF EXISTS leads;
