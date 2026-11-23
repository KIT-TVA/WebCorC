FROM maven:3.9.11-eclipse-temurin-21

RUN apt-get update && apt-get install -y --no-install-recommends python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ./backend /app/
COPY ./tools /app/tools/
ENTRYPOINT ["mvn", "mn:run"]