-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    garmin_username TEXT,
    garmin_password TEXT
);

-- Garmin Data Table
CREATE TABLE garmin_data (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL,
    attributes JSONB NOT NULL
);

ALTER TABLE users ENABLE ELECTRIC;
ALTER TABLE garmin_data ENABLE ELECTRIC;

