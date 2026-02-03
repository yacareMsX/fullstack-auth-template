-- Migration to add fields for secure certificate storage
ALTER TABLE certificates
ADD COLUMN acronimo VARCHAR(255),
    ADD COLUMN encrypted_p12 TEXT,
    ADD COLUMN iv VARCHAR(255);