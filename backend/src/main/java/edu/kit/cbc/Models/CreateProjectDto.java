package edu.kit.cbc.Models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record CreateProjectDto(String name) { }
