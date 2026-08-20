-- ============================================================
-- PG-SETU: Demo Seed Data
-- One property, 2 buildings, 3 floors, 20 rooms, 48 beds, 35 residents
-- Run ONLY in development. Clear before production use.
-- ============================================================

-- NOTE: This seed assumes you have created an organization and owner user
-- via the auth signup flow first. Replace the UUIDs below with real ones.
-- The app will also provide a "Load Demo Data" button in Settings.

-- Seed will be executed via the app's seed endpoint in development mode.
-- See: /api/dev/seed (only available when NODE_ENV=development)

SELECT 'Demo seed ready - use the app Settings > Load Demo Data button';
