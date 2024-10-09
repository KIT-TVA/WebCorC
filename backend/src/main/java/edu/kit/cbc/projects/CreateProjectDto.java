package edu.kit.cbc.projects;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotBlank;

@Serdeable
public record CreateProjectDto(@NotBlank String name) { }
