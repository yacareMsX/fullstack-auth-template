-- Migration to assign APP_TILE_349 permission to profiles that have APP_TILE_301
DO $$
DECLARE v_auth_object_source_id INTEGER;
v_auth_object_target_id INTEGER;
BEGIN -- Get IDs for the auth objects
SELECT id INTO v_auth_object_source_id
FROM authorization_objects
WHERE code = 'APP_TILE_301';
SELECT id INTO v_auth_object_target_id
FROM authorization_objects
WHERE code = 'APP_TILE_349';
IF v_auth_object_source_id IS NOT NULL
AND v_auth_object_target_id IS NOT NULL THEN -- Insert assignment for all profiles that have the source auth object
INSERT INTO rol_profile_auth_objects (profile_id, auth_object_id)
SELECT profile_id,
    v_auth_object_target_id
FROM rol_profile_auth_objects
WHERE auth_object_id = v_auth_object_source_id ON CONFLICT DO NOTHING;
END IF;
END $$;