FROM maven:3-openjdk-18 AS initial
RUN git clone "https://github.com/KIT-TVA/WebCorC.git"
WORKDIR "/WebCorC"
RUN mvn clean package
# Discard container after WebCorC is packaged/compiled
FROM openjdk:18-jdk-slim-buster AS run
COPY --from=initial /WebCorC/target/edu.kit.cbc.web.war /usr/local/lib/webcorc.war
EXPOSE 8080
ENTRYPOINT ["java","-jar","/usr/local/lib/webcorc.war"]
