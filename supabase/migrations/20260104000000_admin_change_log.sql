-- ============================================================================
-- Admin change log — an undo history for the merchant panel.
--
-- Every admin write records the record's state before and after the change, so
-- a mistake can be reversed from the panel instead of needing a developer.
--
-- Design notes:
--   * before_state / after_state hold the full record, not a diff. A diff is
--     smaller but cannot restore a row whose schema has since gained columns,
--     and the whole point of this table is to be usable months later.
--   * `reverted_at` marks an entry that has already been undone, so the same
--     restore cannot be applied twice.
--   * A revert is itself recorded as a new entry. The log is append-only, which
--     is what makes it trustworthy as a record of who changed what.
-- ============================================================================

CREATE TYPE admin_change_action AS ENUM ('create', 'update', 'delete');

CREATE TABLE IF NOT EXISTS admin_change_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What was touched. entity_type is a plain string rather than an enum so
    -- that adding a newly-manageable entity does not require a migration.
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    -- A human label captured at write time ("Cashmere Overcoat", "VIP20"), so
    -- the history stays readable after the record itself is deleted.
    entity_label TEXT NOT NULL DEFAULT '',

    action admin_change_action NOT NULL,
    summary TEXT NOT NULL DEFAULT '',

    before_state JSONB,
    after_state JSONB,

    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL DEFAULT '',

    -- Set when this entry has been undone; points at the entry that undid it.
    reverted_at TIMESTAMPTZ,
    reverted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- True when this entry was itself produced by undoing another entry.
    is_revert BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_change_log_created ON admin_change_log(created_at DESC);
CREATE INDEX idx_admin_change_log_entity ON admin_change_log(entity_type, entity_id);

-- The log names who changed what and embeds full record snapshots, including
-- cost prices. It carries no anon policy on purpose: every read and write runs
-- server-side behind requireAdmin().
ALTER TABLE admin_change_log ENABLE ROW LEVEL SECURITY;
