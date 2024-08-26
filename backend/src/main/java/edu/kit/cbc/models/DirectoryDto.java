package edu.kit.cbc.models;

import java.util.List;
import java.lang.IllegalArgumentException;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record DirectoryDto(String urn, InodeType inodeType, List<FileDirectoryDto> content) implements FileDirectoryDto {
    public DirectoryDto {
        if (inodeType != InodeType.directory) {
            throw new IllegalArgumentException("Only InodeType.directory is allowed");
        }
    }

    public DirectoryDto(String urn, List<FileDirectoryDto> content) {
        this(urn, InodeType.directory, content);
    }
}
