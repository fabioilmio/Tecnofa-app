-- TECNOFA Gestionale — migration 0001
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY,value TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 role TEXT NOT NULL CHECK (role IN ('AMMINISTRATORE','TECNICO','AMMINISTRAZIONE','LETTURA')),
 active INTEGER NOT NULL DEFAULT 1, force_password_change INTEGER NOT NULL DEFAULT 0,
 password_hash TEXT NOT NULL, permissions_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_seen_at TEXT,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS clients (
 id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,fiscal_code TEXT,phone TEXT,email TEXT,municipality TEXT,district TEXT,address TEXT,postal_code TEXT,province TEXT,area TEXT,main_plant_id TEXT,notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);
CREATE TABLE IF NOT EXISTS plants (
 id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,client_id TEXT NOT NULL,type TEXT,status TEXT NOT NULL DEFAULT 'Attivo' CHECK(status IN ('Attivo','Fuori servizio','Dismesso')),brand TEXT,model TEXT,serial_number TEXT,installation_date TEXT,warranty_until TEXT,power TEXT,refrigerant TEXT,location TEXT,components_json TEXT NOT NULL DEFAULT '[]',notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_plants_client ON plants(client_id);
CREATE INDEX IF NOT EXISTS idx_plants_serial ON plants(serial_number);
CREATE TABLE IF NOT EXISTS interventions (
 id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,client_id TEXT NOT NULL,plant_id TEXT,assigned_user_id TEXT,activity_type TEXT,status TEXT NOT NULL DEFAULT 'BOZZA',scheduled_date TEXT,scheduled_time TEXT,duration_minutes INTEGER,technician_notes TEXT,diagnosis TEXT,work_done TEXT,outcome TEXT,hours REAL,km REAL,total_amount REAL,notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,closed_at TEXT,
 FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE RESTRICT,FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE SET NULL,FOREIGN KEY(assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_interventions_client ON interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_plant ON interventions(plant_id);
CREATE INDEX IF NOT EXISTS idx_interventions_user ON interventions(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE TABLE IF NOT EXISTS appointments (
 id TEXT PRIMARY KEY,intervention_id TEXT NOT NULL UNIQUE,technician_id TEXT,date TEXT NOT NULL,start_time TEXT NOT NULL,duration_minutes INTEGER NOT NULL DEFAULT 60,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,FOREIGN KEY(technician_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_technician ON appointments(technician_id);
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,brand TEXT,original_code TEXT,barcode TEXT,model TEXT,family TEXT,supplier TEXT,supplier_url TEXT,cost REAL NOT NULL DEFAULT 0,sale_price REAL NOT NULL DEFAULT 0,min_stock REAL NOT NULL DEFAULT 0,stock REAL NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE TABLE IF NOT EXISTS stock_movements (
 id TEXT PRIMARY KEY,product_id TEXT NOT NULL,movement_type TEXT NOT NULL CHECK(movement_type IN ('CARICO','SCARICO','RETTIFICA')),quantity REAL NOT NULL,date TEXT NOT NULL,operator_id TEXT,intervention_id TEXT,reason TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT,FOREIGN KEY(operator_id) REFERENCES users(id) ON DELETE SET NULL,FOREIGN KEY(intervention_id) REFERENCES interventions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_intervention ON stock_movements(intervention_id);
CREATE TABLE IF NOT EXISTS intervention_materials (
 id TEXT PRIMARY KEY,intervention_id TEXT NOT NULL,product_id TEXT NOT NULL,quantity REAL NOT NULL CHECK(quantity>0),unit_price REAL NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_intervention_materials_intervention ON intervention_materials(intervention_id);
CREATE TABLE IF NOT EXISTS attachments (
 id TEXT PRIMARY KEY,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,file_name TEXT NOT NULL,mime_type TEXT,storage_key TEXT NOT NULL,size_bytes INTEGER,created_by TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type,entity_id);
CREATE TABLE IF NOT EXISTS activity_log (
 id TEXT PRIMARY KEY,user_id TEXT,entity_type TEXT,entity_id TEXT,action TEXT NOT NULL,details_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type,entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);
CREATE TABLE IF NOT EXISTS settings (
 key TEXT PRIMARY KEY,value_json TEXT NOT NULL,updated_by TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
);
INSERT OR IGNORE INTO app_meta(key,value) VALUES('schema_version','1');
