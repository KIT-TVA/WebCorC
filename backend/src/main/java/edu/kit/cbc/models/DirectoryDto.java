package edu.kit.cbc.models;

import java.util.Set;
import java.lang.IllegalArgumentException;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class DirectoryDto extends FileDirectoryDto {

    private final Set<FileDirectoryDto> content;

    public DirectoryDto(String urn, InodeType inodeType, Set<FileDirectoryDto> content){
        super(urn, inodeType);
        if (inodeType != InodeType.directory) {
            throw new IllegalArgumentException("Only InodeType.directory is allowed");
        }
        this.content = content;
    }

    public DirectoryDto(String urn, Set<FileDirectoryDto> content) {
        this(urn, InodeType.directory, content);
    }

    public Set<FileDirectoryDto> getContent() {
        return content;
    }
}
