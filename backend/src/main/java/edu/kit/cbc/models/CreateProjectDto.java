package edu.kit.cbc.models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record CreateProjectDto(String name) { }
