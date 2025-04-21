package edu.kit.cbc.projects.files.dto;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class FileDto extends FileDirectoryDto {
    public static final String inodeType = "file";

    private final FileType fileType;

    public FileDto(String urn, FileType fileType) {
        super(urn);
        //TODO: set filetype based on filename ending (urn ending)
        this.fileType = fileType;
    }

    @Override
    public String getInodeType() {
        return inodeType;
    }

    public FileType getFileType() {
        return fileType;
    }
}
