package edu.kit.cbc.models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public enum InodeType {
    directory,
    file;
}
