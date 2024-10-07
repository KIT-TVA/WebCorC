package edu.kit.cbc.projects.files;

import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;
import java.util.LinkedList;
import java.net.URI;
import java.lang.IllegalArgumentException;
import java.util.NoSuchElementException;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class DirectoryDto extends FileDirectoryDto {

    private final Set<FileDirectoryDto> content;

    public void addFilePath(URI path) {
        addFilePath(
            new LinkedList<String>(
                Arrays.asList(
                    path.getPath().split("/")
                )
            ),
            path.getPath().endsWith("/") ? InodeType.directory : InodeType.file
        );
    }

    private void addFilePath(LinkedList<String> path, InodeType inodeType) {
        String name = path.removeFirst();

        if (path.isEmpty() && inodeType == InodeType.file) {
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
                        return fdd.getUrn().equals(name) && fdd.getInodeType() == InodeType.directory;
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
            path.getPath().endsWith("/") ? InodeType.directory : InodeType.file
        );
    }

    private void removeFilePath(LinkedList<String> path, InodeType inodeType) {
        //TODO: consider deleting empty parent directories as well
        String name = path.removeFirst();
        if (!path.isEmpty()) {
            DirectoryDto nextDir;
            try {
                nextDir = (DirectoryDto) content.stream()
                    .filter(
                        fdd -> {
                            return fdd.getUrn().equals(name) && fdd.getInodeType() == InodeType.directory;
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
            return fdd.getUrn().equals(name) && fdd.getInodeType() == inodeType;
        });
    }

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
