package edu.kit.cbc.projects.files.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import io.micronaut.serde.annotation.Serdeable;

import java.net.URI;
import java.util.*;

@Serdeable
public class DirectoryDto extends FileDirectoryDto {
    public static final String inodeType = "directory";

    @JsonInclude(Include.ALWAYS)
    private final Set<FileDirectoryDto> content;

    public DirectoryDto(String urn, Set<FileDirectoryDto> content) {
        super(urn);
        this.content = content;
    }

    @Override
    public String getInodeType() {
        return inodeType;
    }

    public void addFilePath(URI path) {
        addFilePath(
                new LinkedList<String>(
                        Arrays.asList(
                                path.getPath().split("/")
                        )
                ),
                path.getPath().endsWith("/") ? DirectoryDto.inodeType : FileDto.inodeType
        );
    }

    private void addFilePath(LinkedList<String> path, String inodeType) {
        String name = path.removeFirst();

        if (path.isEmpty() && inodeType.equals(FileDto.inodeType)) {
            FileDto newFile = new FileDto(name, getFileType(name));
            if (!content.contains(newFile)) {
                content.add(newFile);
            }
            return;
        }

        DirectoryDto nextDir;
        try {
            nextDir = (DirectoryDto) content.stream()
                    .filter(
                            fdd -> {
                                return fdd.getUrn().equals(name) && fdd.getInodeType().equals(DirectoryDto.inodeType);
                            })
                    .findFirst()
                    .get();
        } catch (NoSuchElementException e) {
            nextDir = new DirectoryDto(name, new HashSet<FileDirectoryDto>());
            content.add(nextDir);
        }
        nextDir.addFilePath(path, inodeType);
    }

    private FileType getFileType(String name) {
        return name.endsWith(".key") ? FileType.key
                : name.endsWith(".prove") ? FileType.prove
                : name.endsWith(".java") ? FileType.java
                : name.endsWith(".diagram") ? FileType.diagram
                : FileType.other;
    }

    public void removeFilePath(URI path) {
        removeFilePath(
                new LinkedList<String>(
                        Arrays.asList(path.getPath()
                                .split("/")
                        )
                ),
                path.getPath().endsWith("/") ? DirectoryDto.inodeType : FileDto.inodeType
        );
    }

    private void removeFilePath(LinkedList<String> path, String inodeType) {
        //TODO: consider deleting empty parent directories as well
        String name = path.removeFirst();
        if (!path.isEmpty()) {
            DirectoryDto nextDir;
            try {
                nextDir = (DirectoryDto) content.stream()
                        .filter(
                                fdd -> {
                                    return fdd.getUrn().equals(name) && fdd.getInodeType().equals(DirectoryDto.inodeType);
                                })
                        .findFirst()
                        .get();
            } catch (NoSuchElementException e) {
                return;
            }
            nextDir.removeFilePath(path, inodeType);
            return;
        }

        content.removeIf(fdd -> {
            return fdd.getUrn().equals(name) && fdd.getInodeType().equals(inodeType);
        });
    }

    public Set<FileDirectoryDto> getContent() {
        return content;
    }
}
