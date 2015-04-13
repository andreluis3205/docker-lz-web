FROM richarvey/nginx-php-fpm
MAINTAINER javier.ramon@gmail.com

RUN /bin/rm -rf /usr/share/nginx/html/
COPY /lz_template /usr/share/nginx/html
RUN chown -Rf nginx.nginx /usr/share/nginx/html/
WORKDIR /usr/share/nginx/html/
RUN chmod ugo-w -R .
RUN chmod u+w -R stats stats/year stats/month stats/day uploads/ _log/ _config/

COPY /entrypoint.sh /
RUN chmod 755 /start.sh

# Expose Ports
EXPOSE 443
EXPOSE 80

VOLUME [ "/usr/share/nginx/html/_log" ] 

CMD ["/bin/bash", "/entrypoint.sh"]
