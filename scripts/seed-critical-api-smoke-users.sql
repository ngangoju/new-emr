-- CI/local-only fixture for scripts/run-critical-api-smoke.mjs.
-- Password for these users is "password123".

CREATE OR REPLACE FUNCTION ensure_critical_api_smoke_user(
    p_username VARCHAR,
    p_email VARCHAR,
    p_role_name VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_role_id UUID;
    v_password_hash VARCHAR := '$2a$10$rHvJdEt3WRHbGclw4Orodeyi/92wUyvXazSqEyVkazSUWJboC6upm';
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;

    IF v_role_id IS NULL THEN
        RAISE NOTICE 'Role % does not exist, skipping smoke user %', p_role_name, p_username;
        RETURN;
    END IF;

    INSERT INTO users (username, email, password_hash, active)
    VALUES (p_username, p_email, v_password_hash, true)
    ON CONFLICT (username) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        active = true,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_id;

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    INSERT INTO user_profiles (user_id, first_name, last_name)
    VALUES (v_user_id, p_first_name, p_last_name)
    ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

SELECT ensure_critical_api_smoke_user('receptionist_emr', 'receptionist@emr.rw', 'RECEPTIONIST', 'Main', 'Receptionist');
SELECT ensure_critical_api_smoke_user('nurse_emr', 'nurse@emr.rw', 'NURSE', 'Main', 'Nurse');
SELECT ensure_critical_api_smoke_user('cashier_emr', 'cashier_emr@emr.rw', 'CASHIER', 'Main', 'Cashier');

DROP FUNCTION ensure_critical_api_smoke_user(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
