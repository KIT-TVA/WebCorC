package edu.kit.cbc.models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class FileDto extends FileDirectoryDto {

    private final FileType fileType;

    public FileDto(String urn, InodeType inodeType, FileType fileType) {
        super(urn, inodeType);
        if (inodeType != InodeType.file) {
            throw new IllegalArgumentException("Only InodeType.file is allowed");
        }
        this.fileType = fileType;
    }

    public FileDto(String urn, FileType type) {
        this(urn, InodeType.file, type);
    }

    public FileType getFileType() {
        return fileType;
    }
}
