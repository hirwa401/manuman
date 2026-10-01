-- Vehicle spec fields migration
-- Run this in your Supabase SQL editor to add extended vehicle details

ALTER TABLE fleet
  ADD COLUMN IF NOT EXISTS seats integer,
  ADD COLUMN IF NOT EXISTS doors integer,
  ADD COLUMN IF NOT EXISTS transmission text,
  ADD COLUMN IF NOT EXISTS fuel_type text,
  ADD COLUMN IF NOT EXISTS mpg text,
  ADD COLUMN IF NOT EXISTS mileage text,
  ADD COLUMN IF NOT EXISTS luggage_capacity text,
  ADD COLUMN IF NOT EXISTS mileage_allowance text,
  ADD COLUMN IF NOT EXISTS extra_mile_price numeric,
  ADD COLUMN IF NOT EXISTS deposit numeric,
  ADD COLUMN IF NOT EXISTS cancellation_policy text,
  ADD COLUMN IF NOT EXISTS damage_notes text;

-- Update existing seed vehicles with spec data
UPDATE fleet SET
  seats = 5,
  doors = 4,
  transmission = 'Automatic',
  fuel_type = 'Hybrid',
  mpg = '38 city / 35 hwy',
  mileage_allowance = 'Unlimited mileage included'
WHERE make = 'Toyota' AND model = 'RAV4 Hybrid';

UPDATE fleet SET
  seats = 8,
  doors = 4,
  transmission = 'Automatic',
  fuel_type = 'Gasoline',
  mpg = '19 city / 28 hwy',
  mileage_allowance = 'Unlimited mileage included'
WHERE make = 'Honda' AND model = 'Odyssey XL';

UPDATE fleet SET
  seats = 5,
  doors = 4,
  transmission = 'Automatic',
  fuel_type = 'Gasoline',
  mpg = '28 city / 38 hwy',
  mileage_allowance = 'Unlimited mileage included'
WHERE make = 'Chevrolet' AND model = 'Cruze';
