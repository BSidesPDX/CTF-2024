FROM node:22.7-bookworm-slim
RUN apt-get -qq update && apt-get -qq --no-install-recommends install xinetd
WORKDIR chal
COPY * /chal/
RUN useradd chal
RUN chown -R root:root /chal/*
RUN chmod -R 777 /chal/*
EXPOSE 31337
CMD /usr/sbin/xinetd -syslog local0 -dontfork -f /chal/xinetd.conf
