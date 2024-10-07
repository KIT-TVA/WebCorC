package edu.kit.cbc.projects;

import jakarta.validation.constraints.NotBlank;

public interface ProjectService {
    ReadProjectDto create(CreateProjectDto project);
    ReadProjectDto updateById(@NotBlank String id, ReadProjectDto project);
    ReadProjectDto updateById(@NotBlank String id, CreateProjectDto project);
    ReadProjectDto findById(@NotBlank String id);
    void deleteById(@NotBlank String id);
}
