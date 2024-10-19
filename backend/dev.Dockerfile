FROM maven:3.9.9
WORKDIR /app
ENTRYPOINT ["mvn", "mn:run"]
