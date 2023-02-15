# WebCorC

#### Launch server

Simply run `mvn spring-boot:run`. The web interface can then be accessed under `localhost:8080/edu.kit.cbc.web`.
If you do not have a local Maven installation, use the Maven wrapper (`mvnw`).

---
#### Backend development with Eclipse IDE

##### Required plugins
* Spring Tools (aka Spring Tool Suite) *installation via the Eclipse Marketplace*
* [M2Eclipse](https://www.eclipse.org/m2e/) *should come pre-installed with Eclipse IDE for Java Developers*

You can then debug `WebCorCApplication` as a Spring Boot application.

----
#### Frontend development

All frontend files are located in `src/main/resources/static`.  Use
your favorite web development editor to open the files and start
developing. The required JavaScript dependencies are vendored. Do not
use the `package.json` to resolve dependencies.

---
#### Troubleshooting

* WebCorC requires Java 11. Maven will ensure that WebCorC is built with Java 11.
* If Maven appears to be stuck, try fetching a fresh Maven wrapper (`mvn -N wrapper:wrapper`) or use a local Maven installation to build WebCorC.

---
#### Dockerfile

This repository contains three Dockerfiles:

- `Dockerfile`: Fetches upstream code and builds it into a standalone WAR file. This WAR file is then used as the entry point of the resulting container.
- `Dockerfile.alt`: Does not fetch upstream, uses the local code to build a standalone WAR file.
- `Dockerfile.live`: Fetches upstream code. No WAR file is built, the container uses `mvn spring-boot:run` as its entry point.

After building a Docker image with any of the supplied Dockerfiles, run WebCorC with the following command:
`sudo docker run -p 8080:8080 -d -v /tmp/WebCorC:/tmp/WebCorC webcorc:latest`
(assuming that the built image is called "webcorc")

Now navigate to `localhost:8080/edu.kit.cbc.web`. You might need to disable your firewall.
The working directory of the WebCorC instance inside the container can be accessed by the host through the `/tmp/WebCorC` directory.
You can redirect the container's 8080 port to another port on the host by changing the `-p` option.
