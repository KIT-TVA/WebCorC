package edu.kit.cbc.projects.files.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "inodeType")
@JsonSubTypes({
        @JsonSubTypes.Type(value = FileDto.class, name = FileDto.inodeType),
        @JsonSubTypes.Type(value = DirectoryDto.class, name = DirectoryDto.inodeType)
})
public abstract class FileDirectoryDto {

    @JsonInclude(Include.ALWAYS)
    private final String urn;

    public FileDirectoryDto(String urn) {
        this.urn = urn;
    }

    public abstract String getInodeType();

    public String getUrn() {
        return urn;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if (!(obj instanceof FileDirectoryDto)) {
            return false;
        }

        FileDirectoryDto fddto = (FileDirectoryDto) obj;
        return fddto.getUrn().equals(this.urn) && fddto.getInodeType() == this.getInodeType();
    }

    @Override
    public int hashCode() {
        return urn.hashCode() + getInodeType().hashCode();
    }
}
