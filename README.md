### USAGE ###

Usage example:

GL_DB_HOST="$(echo "${GL_DB_HOST:?"GL_GB_HOST not configured"}" | base64)"
GL_DB_USER="$(echo "${GL_DB_USER:?"GL_DB_USER not configured"}" | base64)"
GL_DB_PASS="$(echo "${GL_DB_PASS:?"GL_DB_PASS not configured"}" | base64)"
GL_DB_NAME="$(echo "${GL_DB_NAME:?"GL_DB_NAME not configured"}" | base64)"
GL_DB_PREFIX="$(echo "${GL_DB_PREFIX:-"lz_"}" | base64)"
GL_HOST="$(echo "${GL_HOST:?"GL_HOST not configured"}" | base64)"

