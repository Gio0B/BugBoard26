CREATE OR REPLACE FUNCTION set_issue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS issues_set_updated_at ON issues;

CREATE TRIGGER issues_set_updated_at
BEFORE UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION set_issue_updated_at();

CREATE INDEX IF NOT EXISTS issues_active_created_at_idx
    ON issues (created_at DESC, id DESC)
    WHERE archived = FALSE;

CREATE INDEX IF NOT EXISTS issues_active_type_idx
    ON issues (type, created_at DESC)
    WHERE archived = FALSE;

CREATE INDEX IF NOT EXISTS issues_active_status_idx
    ON issues (status, created_at DESC)
    WHERE archived = FALSE;

CREATE INDEX IF NOT EXISTS issues_active_priority_idx
    ON issues (priority, created_at DESC)
    WHERE archived = FALSE;

CREATE INDEX IF NOT EXISTS issues_archived_created_at_idx
    ON issues (created_at DESC, id DESC)
    WHERE archived = TRUE;

CREATE INDEX IF NOT EXISTS issues_author_id_idx
    ON issues (author_id);

CREATE INDEX IF NOT EXISTS comments_issue_created_at_idx
    ON comments (issue_id, created_at ASC, id ASC);

CREATE INDEX IF NOT EXISTS comments_author_id_idx
    ON comments (author_id);
