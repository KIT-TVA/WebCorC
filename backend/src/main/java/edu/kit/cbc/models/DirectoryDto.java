package edu.kit.cbc.models;

import java.util.List;
import java.lang.IllegalArgumentException;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class DirectoryDto extends FileDirectoryDto {

    private final List<FileDirectoryDto> content;

    public DirectoryDto(String urn, InodeType inodeType, List<FileDirectoryDto> content){
        super(urn, inodeType);
        if (inodeType != InodeType.directory) {
            throw new IllegalArgumentException("Only InodeType.directory is allowed");
        }
        this.content = content;
    }

    public DirectoryDto(String urn, List<FileDirectoryDto> content) {
        this(urn, InodeType.directory, content);
    }

    public List<FileDirectoryDto> getContent() {
        return content;
    }
}
