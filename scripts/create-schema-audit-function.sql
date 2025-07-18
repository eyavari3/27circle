-- Create Schema Audit Function for Supabase
-- This function will allow us to run raw SQL queries to inspect the actual schema

-- 1. Create a function that can execute dynamic SQL and return JSON
CREATE OR REPLACE FUNCTION public.schema_audit(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
BEGIN
    -- Execute the dynamic query and convert result to JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result_json;
    
    -- Return the result
    RETURN COALESCE(result_json, '[]'::JSON);
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.schema_audit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schema_audit(TEXT) TO service_role;

-- 3. Add comment explaining the function
COMMENT ON FUNCTION public.schema_audit(TEXT) IS 'Schema audit function for inspecting database metadata. Returns query results as JSON.';

-- Test the function with a simple query
SELECT public.schema_audit('SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'' LIMIT 5') AS test_result;