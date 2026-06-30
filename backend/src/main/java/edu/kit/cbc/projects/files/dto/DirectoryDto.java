package edu.kit.cbc.projects.files.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import io.micronaut.serde.annotation.Serdeable;
import java.net.URI;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

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

    public void addFilePath(Path path) {
        List<Path> pathElements = new ArrayList<>();
        path.iterator().forEachRemaining(pathElements::add);
        addFilePath(
            new ArrayList<>(pathElements.stream().map(Path::toString).toList()),
            path.getName(path.getNameCount() - 1).toFile().isDirectory() ? DirectoryDto.inodeType : FileDto.inodeType
        );
    }

    private void addFilePath(List<String> path, String inodeType) {
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
                : name.endsWith(".proof") ? FileType.prove
                : name.endsWith(".java") ? FileType.java
                : name.endsWith(".diagram") ? FileType.diagram
                : FileType.other;
    }

    public void removeFilePath(Path path) {
        List<Path> pathElements = new ArrayList<>();
        path.iterator().forEachRemaining(pathElements::add);
        removeFilePath(
            pathElements.stream().map(Path::toString).toList(),
            path.getName(path.getNameCount() - 1).toFile().isDirectory() ? DirectoryDto.inodeType : FileDto.inodeType
        );
    }

    private void removeFilePath(List<String> path, String inodeType) {
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
