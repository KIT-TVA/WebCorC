package edu.kit.cbc.models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class FileDirectoryDto {
    private final String urn;
    private final InodeType inodeType;

    public FileDirectoryDto(String urn, InodeType inodeType) {
        this.urn = urn;
        this.inodeType = inodeType;
    }

    public String getUrn() {
        return urn;
    }

    public InodeType getInodeType() {
        return inodeType;
    }
}
