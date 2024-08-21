package edu.kit.cbc.Models;

import java.util.List;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record DirectoryDto(String urn, String inodeType, List<FileDirectoryDto> content) implements FileDirectoryDto { }
