all: latest tag5.4.0.2 tag5.4.0.1 tag6.0.0.0 tag6.0.0.4

tag5.4.0.1:
	cd 5.4.0.1 && make

tag5.4.0.2:
	cd 5.4.0.2 && make

tag6.0.0.0:
	cd 6.0.0.0 && make

tag6.0.0.4:
	cd 6.0.0.4 && make

latest: tag6.0.0.4
	docker tag -f jramon76/lz-web:6.0.0.4 jramon76/lz-web:latest

#beta: tag6.0.0.0
#	docker tag -f jramon76/lz-web:6.0.0.0 jramon76/lz-web:beta

