#!/bin/bash

echo "Configuring lzchat site"

GL_DB_HOST=${GL_DB_HOST:-$LZ_MYSQL_PORT_3306_TCP_ADDR}
GL_DB_HOST=${GL_DB_HOST:?"GL_DB_HOST not configured"}
GL_DB_PORT=${GL_DB_PORT:-$LZ_MYSQL_PORT_3306_TCP_PORT}
GL_DB_PORT=${GL_DB_PORT:-3306}
GL_DB_HOST="${GL_DB_HOST}:${GL_DB_PORT}"

GL_DB_USER=${GL_DB_USER:-$LZ_MYSQL_ENV_MYSQL_USER}
GL_DB_USER="${GL_DB_USER:?"GL_DB_USER not configured"}"

GL_DB_PASS=${GL_DB_PASS:-$LZ_MYSQL_ENV_MYSQL_PASSWORD}
GL_DB_PASS="${GL_DB_PASS:?"GL_DB_PASS not configured"}"

GL_DB_PREFIX=${GL_DB_PREFIX:-"lz_"}

GL_DB_NAME=${GL_DB_NAME:-$LZ_MYSQL_ENV_MYSQL_DATABASE}
GL_DB_NAME="${GL_DB_NAME:?"GL_DB_NAME not configured"}"

GL_HOST="${GL_DB_HOST:?"GL_HOST not configured"}"

GL_DB_HOST="$(echo "${GL_DB_HOST}" | base64)"
GL_DB_USER="$(echo "${GL_DB_USER}" | base64)"
GL_DB_PASS="$(echo "${GL_DB_PASS}" | base64)"
GL_DB_NAME="$(echo "${GL_DB_NAME}" | base64)"
GL_DB_PREFIX="$(echo "${GL_DB_PREFIX}" | base64)"
GL_HOST="$(echo "${GL_HOST}" | base64)"

sed -i -e 's/$_CONFIG\[0\]\["gl_db_host"\] = "";/$_CONFIG[0]["gl_db_host"] = "'$GL_DB_HOST'";/'   _config/default.config.inc.php
sed -i -e 's/$_CONFIG\[0\]\["gl_db_user"\] = "";/$_CONFIG[0]["gl_db_user"] = "'$GL_DB_USER'";/'   _config/default.config.inc.php
sed -i -e 's/$_CONFIG\[0\]\["gl_db_pass"\] = "";/$_CONFIG[0]["gl_db_pass"] = "'$GL_DB_PASS'";/'   _config/default.config.inc.php
sed -i -e 's/$_CONFIG\[0\]\["gl_db_name"\] = "";/$_CONFIG[0]["gl_db_name"] = "'$GL_DB_NAME'";/'   _config/default.config.inc.php
sed -i -e 's/$_CONFIG\[0\]\["gl_db_prefix"\] = "";/$_CONFIG[0]["gl_db_prefix"] = "'$GL_DB_PREFIX'";/'   _config/default.config.inc.php
sed -i -e 's/$_CONFIG\[0\]\["gl_host"\] = "";/$_CONFIG[0]["gl_host"] = "'$GL_HOST'";/'   _config/default.config.inc.php

exec /start.sh
