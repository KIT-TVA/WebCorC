# WebCorC

This is a guide on how to launch and set up WebCorC for development.
* checkout the [repository](https://svn.isf.cs.tu-bs.de/svn/webcorc)

---
#### Launch server

* go to the root folder and open a commandline tool.  
 UNIX syntax:`./mvnw spring-boot:run`  
  Windows syntax: `mvnw spring-boot:run`
* **done:** open a browser (preferably Google Chrome) and go to *localhost:8080/de.tu_bs.cs.isf.cbc.web*

---
#### Setup EclipseIDE for backend development

##### Required plugins
* Spring Tools (aka Spring Tool Suite) *installation via Marketplace*
* [M2Eclipse](https://www.eclipse.org/m2e/) *installation via update site*

Run or debug the 'WebCorCApplication' as Spring Boot app or Java application.
and view the frontend on *localhost:8080/de.tu_bs.cs.isf.cbc.web*
----

#### Frontend development

All frontend files are located in: `src/main/resources/static`  
Use your favorite web development editor to open the files and start
developing. 

---
#### Troubleshoot

* (There may occur problems due to Java Version. Please install the latest.)
* Maven wrapper rebuild(Maven must be installed): `mvn -N wrapper:wrapper` 

#### Dockerfile

The supplied Dockerfile clones this respository, builds a WAR file and serves WebCorc on port 8080.
After building the Docker image, run WebCorC with the following command:
`sudo docker run -p 8080:8080 -d -v /tmp/WebCorC:/tmp/WebCorC webcorc:latest`
(assuming that the built image is called "webcorc")
Now navigate to `localhost:8080/de.tu_bs.cs.isf.cbc.web`. You might need to disable your firewall.
The working directory of the WebCorC instance inside the container can be accessed by the host through the `/tmp/WebCorC` directory.