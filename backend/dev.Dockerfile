FROM maven:3.9.11-eclipse-temurin-21

WORKDIR /app

# Copy everything first
COPY ./ /app/

# Expose port
EXPOSE 8080

# Pre-download dependencies and Micronaut plugin
RUN mvn dependency:go-offline

# Start the backend using Maven and Micronaut plugin
ENTRYPOINT ["mvn", "mn:run"]
