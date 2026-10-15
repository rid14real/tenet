#!/bin/sh
# Runs once when the database volume is first created. The app connects as tenet_app, which
# cannot bypass row-level security, so each organisation only ever sees its own rows.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE tenet_app LOGIN PASSWORD '${APP_DB_PASSWORD}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER SCHEMA public OWNER TO tenet_app;
GRANT ALL ON DATABASE ${POSTGRES_DB} TO tenet_app;
SQL
