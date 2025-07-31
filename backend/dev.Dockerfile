FROM maven:3.9.11
WORKDIR /app
COPY ./ /app/
ENTRYPOINT ["mvn", "mn:run"]
