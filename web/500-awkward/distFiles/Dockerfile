FROM debian:bookworm-slim

RUN apt update \
  && apt upgrade -y \
  && apt install -y ucspi-tcp

# Add project code
COPY . /app/

RUN cd /app \
  && useradd -M awkuser \
  && chmod -R a=rX /app \
  && chmod +x /app/*.sh

# Run the server
USER awkuser
WORKDIR /app
EXPOSE 8080
CMD "/app/run_chal.sh"
