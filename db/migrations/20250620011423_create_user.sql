-- migrate:up
CREATE TABLE IF NOT EXISTS "user" (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT email_unique UNIQUE(email),
  PRIMARY KEY (id)
);

-- migrate:down
DROP TABLE IF EXISTS "user";