FROM rust:1.82
WORKDIR /root

COPY . build/

RUN cd build && cargo build --release

EXPOSE 8080
CMD /root/build/target/release/squishy

