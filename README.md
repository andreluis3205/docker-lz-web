### USAGE ###

Usage example:

	docker run -d --name lz-db jramon76/lz-db
	docker run -d -p 8181:80 --link lz-db:lz_mysql -e GL_HOST=servername:8181

