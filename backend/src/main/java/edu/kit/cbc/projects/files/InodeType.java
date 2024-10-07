package edu.kit.cbc.projects.files;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public enum InodeType {
    directory,
    file;
}
