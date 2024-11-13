FROM amd64/ubuntu:24.04
RUN apt-get -qq update && apt-get -qq --no-install-recommends install xinetd
WORKDIR chal
COPY password /chal
COPY xinetd.conf /chal
COPY airline /chal
COPY run_chal.sh /chal
COPY flag /chal
RUN useradd chal
RUN chown -R root:root /chal/*
RUN chmod -R 777 /chal/*
EXPOSE 31337
CMD /usr/sbin/xinetd -syslog local0 -dontfork -f /chal/xinetd.conf
