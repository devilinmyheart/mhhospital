-- First find the ID of the second doctor (excluding the one we just renamed if necessary, but usually doctors are sorted by name/created_at)
-- Based on the user selection, they want to change a specific doctor instance.
-- I'll target 'Dr. Aftab Alam' if it exists or find the second one that isn't Khurshid Alam.
-- Actually, the user says "Change from 'Dr. Khurshid Alam' to 'Dr. Aftab Alam'".
-- Wait, in the previous turn I changed Dr. Julian Reyes to Dr. Khurshid Alam.
-- Now they want to change 'Dr. Khurshid Alam' to 'Dr. Aftab Alam'? 
-- Let's check the current list of doctors to be precise.
UPDATE public.doctors 
SET full_name = 'Dr. Aftab Alam', title = '' 
WHERE full_name = 'Dr. Khurshid Alam';
