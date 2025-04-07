package edu.kit.cbc.projects;

import jakarta.validation.constraints.NotBlank;

import java.net.URI;

public interface ProjectService {
    ReadProjectDto create(CreateProjectDto project);

    ReadProjectDto updateById(@NotBlank String id, ReadProjectDto project);

    ReadProjectDto updateById(@NotBlank String id, CreateProjectDto project);

    ReadProjectDto findById(@NotBlank String id);

    boolean existsById(@NotBlank String id);

    void addFilePathToId(@NotBlank String id, URI uri);

    void removeFilePathFromId(@NotBlank String id, URI uri);

    void deleteById(@NotBlank String id);
}
