
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.raw_user_meta_data->>'phone',''), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATALOG
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  brand text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  quality text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT 'unit',
  price numeric(12,2) NOT NULL DEFAULT 0,
  available boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT SELECT ON public.materials TO anon;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials readable" ON public.materials FOR SELECT USING (true);
CREATE POLICY "materials admin write" ON public.materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.delivery_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location text NOT NULL,
  to_location text NOT NULL,
  charge numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_location, to_location)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_rules TO authenticated;
GRANT SELECT ON public.delivery_rules TO anon;
GRANT ALL ON public.delivery_rules TO service_role;
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery rules readable" ON public.delivery_rules FOR SELECT USING (true);
CREATE POLICY "delivery rules admin write" ON public.delivery_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ORDERS
CREATE SEQUENCE public.order_number_seq START 1001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE DEFAULT ('ORD-' || nextval('public.order_number_seq')),
  user_id uuid NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  site_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  location_note text NOT NULL DEFAULT '',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  delivery_charge numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Order Placed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders insert own" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  quality text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  quantity numeric(12,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  line_total numeric(12,2) NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  for_admin boolean NOT NULL DEFAULT false,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications read" ON public.notifications FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR (for_admin AND public.has_role(auth.uid(),'admin')));
CREATE POLICY "notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications update" ON public.notifications FOR UPDATE TO authenticated
  USING ((user_id = auth.uid()) OR (for_admin AND public.has_role(auth.uid(),'admin')))
  WITH CHECK ((user_id = auth.uid()) OR (for_admin AND public.has_role(auth.uid(),'admin')));

-- SEED
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Cement','cement',1),('Bricks','bricks',2),('Sand','sand',3),('Steel','steel',4),('Other Materials','other',5);

INSERT INTO public.materials (name, category_id, brand, type, quality, unit, price, available)
SELECT v.name, c.id, v.brand, v.type, v.quality, v.unit, v.price, true
FROM (VALUES
  ('Cement','cement','UltraTech','OPC','53 Grade','Bag',450),
  ('Cement','cement','ACC','OPC','53 Grade','Bag',440),
  ('Cement','cement','Ramco','OPC','53 Grade','Bag',430),
  ('Cement','cement','Dalmia','PPC','43 Grade','Bag',400),
  ('Red Brick','bricks','Local','Clay Brick','Standard','Piece',8),
  ('Fly Ash Brick','bricks','Local','Fly Ash','Standard','Piece',7),
  ('M-Sand','sand','Local','Manufactured Sand','Standard','Load',5000),
  ('P-Sand','sand','Local','Plastering Sand','Standard','Load',6000),
  ('River Sand','sand','Local','Natural','Premium','Load',9000),
  ('TMT Steel','steel','Kamadhenu','TMT Bar','8mm Fe500',' Kg',65),
  ('TMT Steel','steel','Kamadhenu','TMT Bar','10mm Fe500','Kg',64),
  ('TMT Steel','steel','Kamadhenu','TMT Bar','12mm Fe500','Kg',63),
  ('Concrete Block','other','Local','Solid Block','8 inch','Piece',45),
  ('Blue Metal (Jelly)','other','Local','Aggregate','20mm','Load',12000),
  ('Binding Wire','other','Local','GI Wire','18 Gauge','Kg',80)
) AS v(name, cat, brand, type, quality, unit, price)
JOIN public.categories c ON c.slug = v.cat;

INSERT INTO public.delivery_rules (from_location, to_location, charge) VALUES
  ('Palakkad','Coimbatore',500),('Palakkad','Pollachi',300),('Palakkad','Other',700);
