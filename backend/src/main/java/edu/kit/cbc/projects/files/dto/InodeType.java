package edu.kit.cbc.projects.files.dto;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public enum InodeType {
    directory,
    file;
}
