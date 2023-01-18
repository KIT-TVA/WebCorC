# WebCorC

#### Launch server

Simply run `mvn spring-boot:run`. The web interface can then be accessed under `localhost:8080/de.tu_bs.cs.isf.cbc.web`.
If you do not have a local Maven installation, use the Maven wrapper (`mvnw`).

---
#### Backend development with Eclipse IDE

##### Required plugins
* Spring Tools (aka Spring Tool Suite) *installation via the Eclipse Marketplace*
* [M2Eclipse](https://www.eclipse.org/m2e/) *should come pre-installed with Eclipse IDE for Java Developers*

You can then debug `WebCorCApplication` as a Spring Boot application.

----
#### Frontend development

All frontend files are located in `src/main/resources/static`.
Use your favorite web development editor to open the files and start
developing. 

---
#### Troubleshooting

* WebCorC requires Java 11. Maven will ensure that WebCorC is built with Java 11.
* If Maven appears to be stuck, try fetching a fresh Maven wrapper (`mvn -N wrapper:wrapper`) or use a local Maven installation to build WebCorC.

---
#### Dockerfile

The supplied Dockerfile clones this respository, builds a WAR file and serves WebCorC on port 8080.

After building the Docker image, run WebCorC with the following command:
`sudo docker run -p 8080:8080 -d -v /tmp/WebCorC:/tmp/WebCorC webcorc:latest`
(assuming that the built image is called "webcorc")

Now navigate to `localhost:8080/de.tu_bs.cs.isf.cbc.web`. You might need to disable your firewall.
The working directory of the WebCorC instance inside the container can be accessed by the host through the `/tmp/WebCorC` directory.