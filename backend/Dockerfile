FROM maven:3.9.9 AS builder
COPY . /home/app
WORKDIR /home/app
RUN mvn mn:dockerfile -Dpackaging=docker

FROM eclipse-temurin:21-jre
WORKDIR /home/app
COPY --from=builder /home/app/target/classes /home/app/classes
COPY --from=builder /home/app/target/dependency/* /home/app/libs/
EXPOSE 8080
ENTRYPOINT ["java", "-cp", "/home/app/libs/*:/home/app/classes/", "edu.kit.cbc.Application"]
