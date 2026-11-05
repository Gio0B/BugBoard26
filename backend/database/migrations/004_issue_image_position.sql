ALTER TABLE issue_images ADD COLUMN position SMALLINT;

WITH ranked_images AS (
    SELECT id, (ROW_NUMBER() OVER (PARTITION BY issue_id ORDER BY created_at ASC, id ASC) - 1)::SMALLINT AS position
    FROM issue_images
)
UPDATE issue_images image
SET position = ranked.position
FROM ranked_images ranked
WHERE image.id = ranked.id;

ALTER TABLE issue_images
    ALTER COLUMN position SET NOT NULL,
    ADD CONSTRAINT issue_images_position_allowed CHECK (position BETWEEN 0 AND 4),
    ADD CONSTRAINT issue_images_issue_position_unique UNIQUE (issue_id, position);
