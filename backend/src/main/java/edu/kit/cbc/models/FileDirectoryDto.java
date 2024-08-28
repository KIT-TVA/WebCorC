package edu.kit.cbc.models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public abstract class FileDirectoryDto {
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

    @Override
    public boolean equals(Object obj) {
        if (obj == this) { return true; }
        if (!(obj instanceof FileDirectoryDto)) { return false; }

        FileDirectoryDto fddto = (FileDirectoryDto) obj;
        return fddto.getUrn().equals(this.urn) && fddto.getInodeType() == this.inodeType;
    }

    @Override
    public int hashCode() {
        return urn.hashCode() + inodeType.hashCode();
    }
}
