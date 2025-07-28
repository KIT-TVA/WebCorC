# WebCorC

Webbased Editor for CbC to replace the Eclipse based <a href="https://github.com/KIT-TVA/CorC">CorC</a>.

Cbc is an approach to create correct programs incrementally. 
Guided by pre-/postcondition specifications, a program is developed using refinement rules, guaranteeing the implementation is correct.
With <a href="https://github.com/KIT-TVA/CorC/wiki">CorC</a> we implemented a graphical and textual IDE to create programs following the CbC approach. Starting with an abstract specification, CorC supports CbC developers in refining a program by a sequence of refinement steps and in verifying the correctness of these refinement steps using a deductive verifier.

Learn more information around CorC and the underlying concepts in the <a href="https://github.com/KIT-TVA/CorC/wiki">wiki</a>.

---
#### Backend development

The backend is a REST API developed in Micronaut.
To run the project from cli ensure you have a JDK 21 installed and run:

```bash
./mvnw mn:run 
```

----
#### Frontend development

The frontend is a SPA developed in Angular 19 with Angular Material as the component framework.
For the development dependencies use the devcontainers.json or install the project dependencies with

from root of the project run
```bash
cd ./frontend/ 
```
```bash
npm install
```

For running the development server and linting use the angular cli.
Install the angular cli via npm:
```bash
npm install -g @angular/cli@19
```

And use the serve command in the angular cli to run the development server:
```bash
ng serve
```

- https://angular.dev/
- https://angular.dev/tools/cli
- https://material.angular.io/


#### Note (Windows only)
To use `ng serve`, add the following to the list of environtment variables in `Path`.
Make sure to adjust `USER_NAME`

```bash
C:\Users\USER_NAME\AppData\Roaming\npm\node_modules\@angular\cli\bin
```
```bash
C:\Users\USER_NAME\AppData\Roaming\npm\
```

#### Docker

This repository contains Dockerfiles for the backend and frontend.
The Dockerfiles prefixed with dev. are for development purposes.
For the full deployment of backend and frontend for development via docker-compose files are also included.
To run the stack in development:
```bash
docker compose up -d -f docker-compose.dev.yml
```

Docker V2 uses the following command:

```bash
docker compose --file docker-compose.dev.yml up -d
```

##### Production:

Clone this repository for example into /opt/WebCorC:

```bash
git clone https://github.com/KIT-TVA/WebCorC.git /opt/WebCorC
```


Ensure to change the default values in the `docker-compose.env` file and run:
```bash
docker compose up -d 
```

The production docker compose file includes a caddy webserver for proper deployment.


#### Reverse Proxy (nginx)

If you already have a webserver on the host deployed you must edit the docker compose file:
You need to add port mapping to the frontend and backend services and replace the ports in the upstream blocks.
The following bare configuration is tested but lacks the configuration for certificates for https:

```nginx
upstream webcorc-frontend {
   server 127.0.0.1:<frontend_port>;
}

upstream webcorc-backend {
   server 127.0.0.1:<backend_port>;
}

server {
    listen       80;
    listen       [::]:80;

    access_log  /var/log/nginx/corc.informatik.kit.edu.access.log  main;
    error_log   /var/log/nginx/corc.informatik.kit.edu.error.log;

    location / {
        proxy_pass http://webcorc-frontend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api {
        rewrite ^/api(.*)$ $1 break;
        proxy_pass http://webcorc-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 🛠️ Setup Issues

Having trouble setting up the project? [Open an issue](https://github.com/KIT-TVA/WebCorC/issues) and we'll help you out.