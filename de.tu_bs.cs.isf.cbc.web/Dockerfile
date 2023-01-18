FROM maven:3-openjdk-18 AS initial
RUN git clone "https://github.com/TUBS-ISF/WebCorC.git"
WORKDIR "/WebCorC/de.tu_bs.cs.isf.cbc.web"
RUN mvn clean package
# Discard container after WebCorC is pacakged
FROM openjdk:18-jdk-slim-buster AS run
COPY --from=initial /WebCorC/de.tu_bs.cs.isf.cbc.web/target/de.tu_bs.cs.isf.cbc.web.war /usr/local/lib/webcorc.war
EXPOSE 8080
ENTRYPOINT ["java","-jar","/usr/local/lib/webcorc.war"]
