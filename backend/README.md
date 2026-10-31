## Integration tests

`mvn verify` runs the `*IT` tests with [Micronaut Test Resources](https://micronaut-projects.github.io/micronaut-test-resources/latest/guide/),
which needs a local Docker daemon: `VerifierCatalogIT` starts the mock Verifier
(`../mock-verifier`, the same image `docker-compose.dev.yml` runs) as a generic container. The
build tags that image `webcorc-mock-verifier` itself in `pre-integration-test` (the `docker` CLI
must be on the `PATH`), so nothing has to be built by hand. `-DskipTests` and `-DskipITs` skip
the image build along with the tests; `-Dskip.mock.verifier.image=true` skips only the image
build, for runs that do not start the mock, e.g. with `-Dmicronaut.test.resources.enabled=false`
as CI does. MongoDB is expected at `localhost:27017` (see
`src/test/resources/application-test.yml`).

Docker Engine 29 or newer rejects the API version the bundled Testcontainers negotiates
("client version 1.32 is too old"). Until Test Resources ships a newer Testcontainers, pin the
version for the Test Resources server JVM, e.g. `JAVA_TOOL_OPTIONS=-Dapi.version=1.44 mvn verify`
(or put `api.version=1.44` into `~/.docker-java.properties`).

## Micronaut 4.5.1 Documentation
- [User Guide](https://docs.micronaut.io/4.5.1/guide/index.html)
- [API Reference](https://docs.micronaut.io/4.5.1/api/index.html)
- [Configuration Reference](https://docs.micronaut.io/4.5.1/guide/configurationreference.html)
- [Micronaut Guides](https://guides.micronaut.io/index.html)

---

- [Micronaut Maven Plugin documentation](https://micronaut-projects.github.io/micronaut-maven-plugin/latest/)

## Feature aws-v2-sdk documentation

- [Micronaut AWS SDK 2.x documentation](https://micronaut-projects.github.io/micronaut-aws/latest/guide/)

- [https://docs.aws.amazon.com/sdk-for-java/v2/developer-guide/welcome.html](https://docs.aws.amazon.com/sdk-for-java/v2/developer-guide/welcome.html)

## Feature object-storage-aws documentation

- [Micronaut Object Storage - AWS documentation](https://micronaut-projects.github.io/micronaut-object-storage/latest/guide/)

- [https://aws.amazon.com/s3/](https://aws.amazon.com/s3/)

## Feature test-resources documentation

- [Micronaut Test Resources documentation](https://micronaut-projects.github.io/micronaut-test-resources/latest/guide/)

## Feature data-mongodb documentation

- [Micronaut Data MongoDB documentation](https://micronaut-projects.github.io/micronaut-data/latest/guide/#mongo)

- [https://docs.mongodb.com](https://docs.mongodb.com)

## Feature micronaut-aot documentation

- [Micronaut AOT documentation](https://micronaut-projects.github.io/micronaut-aot/latest/guide/)

## Feature maven-enforcer-plugin documentation

- [https://maven.apache.org/enforcer/maven-enforcer-plugin/](https://maven.apache.org/enforcer/maven-enforcer-plugin/)

## Feature serialization-jackson documentation

- [Micronaut Serialization Jackson Core documentation](https://micronaut-projects.github.io/micronaut-serialization/latest/guide/)

## Feature validation documentation

- [Micronaut Validation documentation](https://micronaut-projects.github.io/micronaut-validation/latest/guide/)


