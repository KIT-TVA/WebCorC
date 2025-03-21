# WebCorC - Frontend
The frontend is a SPA developed in Angular 19 with Angular Material as the component framework.
For the development dependencies use the devcontainers.json or install the project dependencies with

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


## Testing 
Currently no real testing is residing in this project.
Only the generated, and not checked, *.spec.ts for the components exist.

## Tips & Tricks
If you get errors with confusing messages in the browser console and the the application doesn behaves as expected try to check for circular dependencies.
To check for circular dependencies use <a href="https://github.com/pahen/madge">madge</a>.

```bash
madge --circular src/app/app.component.ts
```

Some circular dependencies are normal and dont interfere with the normal operation of the application. 
At point of writing this documentation madge detects 13 circular dependencies.