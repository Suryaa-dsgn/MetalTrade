-- Rollback for 0002_create_lead_notification_deliveries. Destructive — drops all
-- notification delivery records. Run manually and deliberately; never auto-run on
-- startup or deploy.
DROP TABLE IF EXISTS lead_notification_deliveries;
