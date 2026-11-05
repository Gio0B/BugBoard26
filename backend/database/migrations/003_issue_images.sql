CREATE TABLE IF NOT EXISTS issue_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(40) NOT NULL,
    size_bytes INTEGER NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT issue_images_name_not_blank CHECK (LENGTH(BTRIM(original_name)) BETWEEN 1 AND 255),
    CONSTRAINT issue_images_mime_type_allowed CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
    CONSTRAINT issue_images_size_allowed CHECK (size_bytes BETWEEN 1 AND 5242880),
    CONSTRAINT issue_images_size_matches_data CHECK (size_bytes = OCTET_LENGTH(data)),
    CONSTRAINT issue_images_issue_fk FOREIGN KEY (issue_id) REFERENCES issues(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS issue_images_issue_created_at_idx
    ON issue_images (issue_id, created_at ASC, id ASC);

COMMENT ON TABLE issue_images IS 'Optional image attachments stored with their issue; application deletion is not supported.';
