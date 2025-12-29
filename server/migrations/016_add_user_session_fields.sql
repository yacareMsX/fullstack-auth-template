-- Add session tracking fields to users table
ALTER TABLE users
ADD COLUMN last_connection TIMESTAMP,
    ADD COLUMN is_online BOOLEAN DEFAULT FALSE;