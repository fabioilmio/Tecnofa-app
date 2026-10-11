-- TECNOFA Gestionale — pilot administrator seed
-- Run once AFTER schema.sql / migration 0001.
-- The pilot password is temporary and MUST be changed after first login.
INSERT OR IGNORE INTO users (
  id, username, email, name, role, active, force_password_change, password_hash, permissions_json
) VALUES (
  'USR-ADMIN',
  'admin',
  'admin@tecnofa.it',
  'Dervishaj Fatjon',
  'AMMINISTRATORE',
  1,
  1,
  'c70ce1115001a964e4e4ae696efa1dc5805e665f1e44d41afeafb6e6333876b8',
  '{"dashboard":"manage","agenda":"manage","clients":"manage","plants":"manage","interventions":"manage","technicians":"manage","warehouse":"manage","reports":"manage","administration":"manage","archives":"manage","settings":"manage","users":"manage"}'
);
