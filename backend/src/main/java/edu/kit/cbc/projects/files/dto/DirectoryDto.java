package edu.kit.cbc.projects.files.dto;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import java.util.HashSet;
import java.util.Arrays;
import java.util.LinkedList;
import java.net.URI;
import java.util.NoSuchElementException;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class DirectoryDto extends FileDirectoryDto {
    public static final String inodeType = "directory";

    @JsonInclude(Include.ALWAYS)
    private final Set<FileDirectoryDto> content;

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
            //TODO: hardcoded FileType
            FileDto newFile = new FileDto(name, FileType.other);
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

    public DirectoryDto(String urn, Set<FileDirectoryDto> content) {
        super(urn);
        this.content = content;
    }

    public Set<FileDirectoryDto> getContent() {
        return content;
    }
}
