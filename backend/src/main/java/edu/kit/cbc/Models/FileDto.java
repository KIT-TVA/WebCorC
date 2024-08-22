package edu.kit.cbc.Models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record FileDto(String urn, InodeType inodeType, FileType type) implements FileDirectoryDto {
    public FileDto {
        if (inodeType != InodeType.file) {
            throw new IllegalArgumentException("Only InodeType.file is allowed");
        }
    }

    public FileDto(String urn, FileType type) {
        this(urn, InodeType.file, type);
    }
}
