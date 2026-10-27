CREATE TABLE IF NOT EXISTS candy_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient TEXT NOT NULL,
  block TEXT NOT NULL,
  message TEXT NOT NULL,
  anonymous INTEGER NOT NULL DEFAULT 1,
  sender TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delivered')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
