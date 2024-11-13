FROM ghcr.io/gleam-lang/gleam:v1.5.1-erlang-alpine

# Add project code
COPY . /build/

# Compile the project
RUN cd /build \
  && gleam export erlang-shipment \
  && mv build/erlang-shipment /app \
  && rm -r /build \
  && chmod -R a=rX /app \
  && chmod +x /app/entrypoint.sh

# Run the server
WORKDIR /app
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["run"]
