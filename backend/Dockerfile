# Build stage
FROM rust:slim AS builder

WORKDIR /usr/src/app

# Pre-install dependencies to cache Docker layers
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy real sources
COPY src ./src
RUN touch src/main.rs
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/target/release/server /app/wubi-master-api
COPY wubi_seed_data.json /app/

EXPOSE 5000

ENV PORT=5000
ENV DATABASE_URL=postgres://postgres:postgres@db:5432/wubimaster

CMD ["/app/wubi-master-api"]
