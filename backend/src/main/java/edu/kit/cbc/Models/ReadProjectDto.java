package edu.kit.cbc.Models;

import java.util.UUID;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record ReadProjectDto (UUID id, String name, String dateCreated, DirectoryDto files){ }
