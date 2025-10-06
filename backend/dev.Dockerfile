FROM maven:3.9.11-eclipse-temurin-21
WORKDIR /app
COPY ./ /app/
ENTRYPOINT ["mvn", "mn:run"]
