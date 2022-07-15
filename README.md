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

Run or debug the 'WebCorCApplication' as Spring Boot App or Java Application 
and view the frontend on *localhost:8080/de.tu_bs.cs.isf.cbc.web*

___

#### Frontend development

All frontend files are located in: `src/main/resources/static`  
Use your favorite web development editor to open the files and start
developing. 

---
#### Troubleshoot

* (There may occur problems due to Java Version. Please install the latest.)
* Maven wrapper rebuild(Maven must be installed): `mvn -N wrapper:wrapper` 