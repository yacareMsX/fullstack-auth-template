-- 014_user_management.sql
-- Authorization Objects
-- Incluye acciones y accesos
CREATE TABLE IF NOT EXISTS authorization_objects (
    id SERIAL PRIMARY KEY,
    object_type VARCHAR(50) NOT NULL,
    -- 'ACTION' or 'ACCESS'
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Role Profiles
CREATE TABLE IF NOT EXISTS rol_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- N:M Profiles <-> Auth Objects
CREATE TABLE IF NOT EXISTS rol_profile_auth_objects (
    profile_id INTEGER REFERENCES rol_profiles(id) ON DELETE CASCADE,
    auth_object_id INTEGER REFERENCES authorization_objects(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, auth_object_id)
);
-- N:M Roles <-> Profiles
CREATE TABLE IF NOT EXISTS role_rol_profiles (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    profile_id INTEGER REFERENCES rol_profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, profile_id)
);
-- Seed Data: Developer Role
-- Ensure 'dev' role with ID 3 exists.
INSERT INTO roles (id, name, description)
VALUES (3, 'dev', 'Developer') ON CONFLICT (name) DO NOTHING;
-- If for some reason ID 3 was taken by another name (unlikely given previous seeds), we might have an issue, 
-- but given the prompt specific instruction, we assume control here. 
-- However, if 'dev' didn't exist and we created it, we want to ensure ID=3 if possible.
-- Since 'id' is SERIAL, explicit insert works.
-- If 'dev' exists but has different ID, we leave it alone or update it?
-- The prompt strictly says "En la tabla de roles vamos a añadir devevolper , Id = 3 , name = dev."
-- Let's try to enforce it more strictly if needed, but INSERT ... ON CONFLICT (name) DO NOTHING is safest for now.
-- Seed Data: Auth Objects
INSERT INTO authorization_objects (object_type, code, description)
VALUES (
        'ACCESS_APP',
        'APP_USER_MANAGEMENT',
        'Access to User Management App'
    ),
    ('ACTION', 'USER_CREATE', 'Create a new user'),
    ('ACTION', 'USER_EDIT', 'Edit an existing user'),
    ('ACTION', 'USER_DELETE', 'Delete a user'),
    (
        'ACCESS_APP',
        'APP_ROLES',
        'Access to Roles Management'
    ),
    (
        'ACCESS_APP',
        'APP_PROFILES',
        'Access to Profiles Management'
    ),
    (
        'ACCESS_APP',
        'APP_AUTH_OBJECTS',
        'Access to Auth Objects Management'
    ) ON CONFLICT (code) DO NOTHING;