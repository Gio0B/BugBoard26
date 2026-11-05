CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_type') THEN
        CREATE TYPE issue_type AS ENUM ('QUESTION', 'BUG', 'DOCUMENTATION', 'FEATURE');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
        CREATE TYPE issue_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
        CREATE TYPE issue_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    seed_key VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_normalized CHECK (email = LOWER(BTRIM(email))),
    CONSTRAINT users_email_not_blank CHECK (LENGTH(BTRIM(email)) > 3),
    CONSTRAINT users_password_hash_not_blank CHECK (LENGTH(BTRIM(password_hash)) >= 20),
    CONSTRAINT users_seed_key_format CHECK (seed_key IS NULL OR seed_key LIKE 'demo:%'),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_seed_key_unique UNIQUE (seed_key)
);

CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    type issue_type NOT NULL,
    priority issue_priority NOT NULL DEFAULT 'MEDIUM',
    status issue_status NOT NULL DEFAULT 'TODO',
    author_id UUID NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    seed_key VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT issues_title_length CHECK (LENGTH(BTRIM(title)) BETWEEN 1 AND 160),
    CONSTRAINT issues_description_length CHECK (LENGTH(BTRIM(description)) BETWEEN 1 AND 10000),
    CONSTRAINT issues_seed_key_format CHECK (seed_key IS NULL OR seed_key LIKE 'demo:%'),
    CONSTRAINT issues_seed_key_unique UNIQUE (seed_key),
    CONSTRAINT issues_author_fk FOREIGN KEY (author_id) REFERENCES users(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL,
    author_id UUID NOT NULL,
    text TEXT NOT NULL,
    seed_key VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comments_text_length CHECK (LENGTH(BTRIM(text)) BETWEEN 1 AND 5000),
    CONSTRAINT comments_seed_key_format CHECK (seed_key IS NULL OR seed_key LIKE 'demo:%'),
    CONSTRAINT comments_seed_key_unique UNIQUE (seed_key),
    CONSTRAINT comments_issue_fk FOREIGN KEY (issue_id) REFERENCES issues(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT comments_author_fk FOREIGN KEY (author_id) REFERENCES users(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

COMMENT ON TABLE users IS 'Authenticated BugBoard26 users; application deletion is not supported.';
COMMENT ON TABLE issues IS 'All issue categories, including BUG, share this lifecycle and storage.';
COMMENT ON COLUMN issues.archived IS 'Logical archive flag; archived rows and comments are retained.';
COMMENT ON COLUMN users.seed_key IS 'Stable identifier used only by the idempotent demo seed.';
COMMENT ON COLUMN issues.seed_key IS 'Stable identifier used only by the idempotent demo seed.';
COMMENT ON COLUMN comments.seed_key IS 'Stable identifier used only by the idempotent demo seed.';
