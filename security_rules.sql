-- ==========================================
-- KADAI KANAKKU - SECURITY HARDENING SCRIPT
-- ==========================================
-- Please run this entire script in your Supabase SQL Editor.

-- 1. Enable RLS on all tables (if not already enabled)
ALTER TABLE shop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE txns ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing permissive policies to start fresh safely
DROP POLICY IF EXISTS "Allow all access" ON shop_profiles;
DROP POLICY IF EXISTS "Allow all access" ON customers;
DROP POLICY IF EXISTS "Allow all access" ON txns;
DROP POLICY IF EXISTS "Allow all access" ON orders;

-- ==========================================
-- 3. POLICIES FOR SHOP OWNERS (Strict Tenant Isolation)
-- Owners can only access data where user_id (or owner_id) matches their auth.uid()
-- ==========================================

-- shop_profiles
CREATE POLICY "Owner full access to own profile" 
ON shop_profiles FOR ALL 
USING (auth.uid() = owner_id) 
WITH CHECK (auth.uid() = owner_id);

-- customers
CREATE POLICY "Owner full access to own customers" 
ON customers FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- txns
CREATE POLICY "Owner full access to own txns" 
ON txns FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- orders
CREATE POLICY "Owner full access to own orders" 
ON orders FOR ALL 
USING (auth.uid() = shop_owner_id) 
WITH CHECK (auth.uid() = shop_owner_id);

-- ==========================================
-- 4. POLICIES FOR CUSTOMERS (Read-only + Order Creation)
-- Customers can only access data where auth_user_id matches their auth.uid()
-- ==========================================

-- shop_profiles (Public read access so customers can see shop name & UPI ID when paying)
CREATE POLICY "Anyone can read shop profiles" 
ON shop_profiles FOR SELECT 
USING (true);

-- customers (Customers can read their own row)
CREATE POLICY "Customer can read own account" 
ON customers FOR SELECT 
USING (auth.uid() = auth_user_id);

-- txns (Customers can read their own transactions, NO INSERT ALLOWED)
CREATE POLICY "Customer can read own txns" 
ON txns FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- orders (Customers can read their own orders AND insert new orders)
CREATE POLICY "Customer can read own orders" 
ON orders FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Customer can insert own orders" 
ON orders FOR INSERT 
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- ==========================================
-- 5. HARDEN RPC FUNCTIONS (SECURITY DEFINER)
-- ==========================================
-- The link_customer_account RPC bypasses RLS to link an existing customer row to a new auth user.
-- We must restrict it so it can only be called by authenticated users, and it only links if auth_user_id is null.

CREATE OR REPLACE FUNCTION link_customer_account(phone_number text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public
AS $$
DECLARE
  matched_user_id uuid;
  matched_customer_id uuid;
  clean_input text;
BEGIN
  -- Security check: Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Clean the input: extract only digits and take last 10
  clean_input := right(regexp_replace(phone_number, '\D', '', 'g'), 10);

  -- Validate: must be exactly 10 digits
  IF length(clean_input) <> 10 THEN
    RETURN NULL;
  END IF;

  -- Find a customer whose phone's last 10 digits EXACTLY match the input
  -- This prevents partial/fuzzy matches that could link the wrong customer
  SELECT id, user_id INTO matched_customer_id, matched_user_id
  FROM customers
  WHERE right(regexp_replace(phone, '\D', '', 'g'), 10) = clean_input
    AND auth_user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF matched_customer_id IS NOT NULL THEN
    -- Link the account
    UPDATE customers 
    SET auth_user_id = auth.uid() 
    WHERE id = matched_customer_id;
    
    RETURN matched_user_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Allow only authenticated users to execute the RPC
REVOKE EXECUTE ON FUNCTION link_customer_account(text) FROM public;
GRANT EXECUTE ON FUNCTION link_customer_account(text) TO authenticated;
