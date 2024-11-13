FROM python:3.12-slim-bookworm
RUN apt-get -qq update && apt-get -qq --no-install-recommends install xinetd
WORKDIR /chal
COPY requirements.txt /chal/
COPY xinetd.conf /chal/
COPY run_chal.sh /chal/
COPY challenge.py /chal/
COPY flag /chal/
RUN python3 -m pip install -r requirements.txt
RUN useradd chal
RUN chown -R root:root /chal/*
RUN chmod -R 777 /chal/*
EXPOSE 31337
CMD /usr/sbin/xinetd -syslog local0 -dontfork -f /chal/xinetd.conf


