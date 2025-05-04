
-- Create a function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(
  table_name TEXT,
  column_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = check_column_exists.table_name
    AND column_name = check_column_exists.column_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
