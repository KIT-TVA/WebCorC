package edu.kit.cbc.Models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record FileDto(String name, FileType type) implements FileDirectoryDto { }
