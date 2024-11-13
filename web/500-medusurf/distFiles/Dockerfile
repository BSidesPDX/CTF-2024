FROM ghcr.io/gleam-lang/gleam:v1.5.1-erlang-alpine
RUN apk update --no-cache \
  && apk upgrade \
  && apk add --no-cache ucspi-tcp6 python3 py3-pip

# Add project code
COPY . /build/

RUN cd /build/maintenance \
  && pip3 install -r requirements.txt --break-system-packages

# Compile the project
RUN cd /build \
  && gleam export erlang-shipment \
  && mv build/erlang-shipment /app \
  && mv maintenance /app/maintenance \
  && mv run_chal.sh /app/run_chal.sh \
  && rm -r /build \
  && chmod -R a=rX /app \
  && chmod +x /app/entrypoint.sh \
  && chmod +x /app/run_chal.sh

# Run the server
WORKDIR /app
EXPOSE 8080
CMD "/app/run_chal.sh"
