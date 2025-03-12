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

```bash
npm install
```

For running the development server and linting use the angular cli.
```bash
ng serve
```


- https://angular.dev/
- https://angular.dev/tools/cli
- https://material.angular.io/

#### Docker

This repository contains Dockerfiles for the backend and frontend.
The Dockerfiles prefixed with dev. are for development purposes.
For the full deployment of backend and frontend for development via docker-compose files are also included.
To run the stack in development:
```bash
docker compose up -d -f docker-compose.dev.yml
```

For production:
Ensure to change the default values in the `docker-compose.env` file and run:
```bash
docker compose up -d 
```

#### Reverse Proxy (nginx)

To ensure proper working communication between the frontend and backend the production deployment should be deployed behind a reverse proxy.
Following minimal config works with nginx. For production you should add a ssl certificate: 

```nginx
upstream webcorc-frontend {
   server 127.0.0.1:8080;
}

upstream webcorc-backend {
   server 127.0.0.1:<port>;
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