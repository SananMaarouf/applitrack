-- Create a view for aggregated status flow (used by Sankey diagram)
CREATE OR REPLACE VIEW application_status_flow AS
SELECT 
    h.user_id,
    CASE h.from_status
        WHEN 1 THEN 'Applied'
        WHEN 2 THEN 'Phone Screen'
        WHEN 3 THEN 'Interview'
        WHEN 4 THEN 'Assessment'
        WHEN 5 THEN 'Offer'
        WHEN 6 THEN 'Rejected'
        WHEN 7 THEN 'Ghosted'
    END AS "From",
    CASE h.to_status
        WHEN 1 THEN 'Applied'
        WHEN 2 THEN 'Phone Screen'
        WHEN 3 THEN 'Interview'
        WHEN 4 THEN 'Assessment'
        WHEN 5 THEN 'Offer'
        WHEN 6 THEN 'Rejected'
        WHEN 7 THEN 'Ghosted'
    END AS "To",
    COUNT(*) AS "Weight"
FROM application_status_history h
GROUP BY h.user_id, h.from_status, h.to_status
ORDER BY h.user_id, h.from_status, h.to_status;

-- Create a function to automatically track status changes
CREATE OR REPLACE FUNCTION track_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO application_status_history (application_id, user_id, from_status, to_status)
        VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status change tracking
DROP TRIGGER IF EXISTS track_status_change ON applications;
CREATE TRIGGER track_status_change
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION track_application_status_change();
