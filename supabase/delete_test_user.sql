-- ============================================================
-- Delete a test user by collection name
-- Run in: Supabase Dashboard → SQL Editor
--
-- STEP 1: Run the preview block to confirm what will be deleted.
-- STEP 2: If correct, run the delete block.
-- ============================================================

-- ⚙️  Set the collection name of the user you want to remove:
-- (change this value in both blocks below)

-- ============================================================
-- STEP 1 — PREVIEW (read-only, safe to run)
-- ============================================================
SELECT
  u.id            AS user_id,
  u.email         AS email,
  p.collection_name,
  COUNT(r.id)     AS record_count
FROM auth.users u
JOIN public.user_profiles p ON p.user_id = u.id
LEFT JOIN public.records r  ON r.user_id = u.id
WHERE p.collection_name = 'REPLACE WITH COLLECTION NAME'
GROUP BY u.id, u.email, p.collection_name;


-- ============================================================
-- STEP 2 — DELETE (only run after confirming Step 1)
-- ============================================================
-- Deleting the auth user cascades to user_profiles and records
-- automatically due to ON DELETE CASCADE foreign keys.
-- The explicit deletes below are a safety net.

DO $$
DECLARE
  target_name    TEXT := 'REPLACE WITH COLLECTION NAME';
  target_user_id UUID;
  rec_count      INT;
BEGIN
  -- Look up the user
  SELECT user_id INTO target_user_id
  FROM public.user_profiles
  WHERE collection_name = target_name;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with collection name: "%"', target_name;
  END IF;

  -- Count records so we can confirm in the output
  SELECT COUNT(*) INTO rec_count
  FROM public.records
  WHERE user_id = target_user_id;

  -- Delete records
  DELETE FROM public.records WHERE user_id = target_user_id;

  -- Delete profile
  DELETE FROM public.user_profiles WHERE user_id = target_user_id;

  -- Delete auth user (cascades anything remaining)
  DELETE FROM auth.users WHERE id = target_user_id;

  RAISE NOTICE 'Deleted user "%" (id: %) and their % record(s).',
    target_name, target_user_id, rec_count;
END $$;
