ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, phone, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    NEW.raw_user_meta_data->>'country'
  );
  RETURN NEW;
END;
$function$;