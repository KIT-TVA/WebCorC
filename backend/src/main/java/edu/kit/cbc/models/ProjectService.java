package edu.kit.cbc.models;

import jakarta.validation.constraints.NotBlank;

public interface ProjectService {
    ReadProjectDto save(ReadProjectDto project);
    ReadProjectDto findById(@NotBlank String id);
}
