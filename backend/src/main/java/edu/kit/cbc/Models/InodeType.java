package edu.kit.cbc.Models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public enum InodeType {
    directory,
    file;
}
