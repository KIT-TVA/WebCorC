package edu.kit.cbc.editor.verifier.job;

import io.micronaut.serde.annotation.Serdeable;

/**
 * One of the project's source or include files as attached to every start-a-job request,
 * mirroring {@code openapi/schema/verifiers/job/sourceFile.yml}: a project-relative path and
 * the full text — a flat list on the wire, never the backend's directory tree.
 */
@Serdeable
public record SourceFile(String path, String content) {}
