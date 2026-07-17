
DO $$
DECLARE
  new_uid uuid;
BEGIN
  SELECT id INTO new_uid FROM auth.users WHERE email = 'admin@mhhospital.com';
  IF new_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated',
      'admin@mhhospital.com', crypt('mhhospital26', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin"}'::jsonb,
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'admin@mhhospital.com'), 'email', new_uid::text, now(), now(), now());
  END IF;

  INSERT INTO public.profiles (id, full_name) VALUES (new_uid, 'Admin')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Admin';

  INSERT INTO public.user_roles (user_id, role) VALUES (new_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.user_roles WHERE user_id = new_uid AND role = 'patient';
END $$;
