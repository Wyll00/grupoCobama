-- =====================================================================
--  Seed 3 - Usuarios de desarrollo
--
--  >>> SOLO PARA EL ENTORNO LOCAL <<<
--  Los cinco usuarios comparten la contrasena  cobama2026  (bcrypt, coste 10).
--  Este fichero NO se carga en produccion: alli el primer admin se crea a
--  mano y cada encargado recibe su propia contrasena.
-- =====================================================================

SET NAMES utf8mb4;

INSERT INTO usuarios (nombre, email, password_hash, rol, restaurante_id) VALUES
  ('Admin Grupo',        'admin@grupocobama.es',
   '$2a$10$Q9WuIQim91ivSyiZVOnf1uaZKyUdpfZ3jRRIagrt.eMFcrj9f3i4u', 'admin_grupo',     NULL),

  ('Encargado Como en Casa',    'comoencasa@grupocobama.es',
   '$2a$10$Q9WuIQim91ivSyiZVOnf1uaZKyUdpfZ3jRRIagrt.eMFcrj9f3i4u', 'encargado_local', 1),

  ('Encargado La Basilica',     'labasilica@grupocobama.es',
   '$2a$10$Q9WuIQim91ivSyiZVOnf1uaZKyUdpfZ3jRRIagrt.eMFcrj9f3i4u', 'encargado_local', 2),

  ('Encargado La Casa del Mago','lacasadelmago@grupocobama.es',
   '$2a$10$Q9WuIQim91ivSyiZVOnf1uaZKyUdpfZ3jRRIagrt.eMFcrj9f3i4u', 'encargado_local', 3),

  ('Encargado El Descarado',    'eldescarado@grupocobama.es',
   '$2a$10$Q9WuIQim91ivSyiZVOnf1uaZKyUdpfZ3jRRIagrt.eMFcrj9f3i4u', 'encargado_local', 4);
