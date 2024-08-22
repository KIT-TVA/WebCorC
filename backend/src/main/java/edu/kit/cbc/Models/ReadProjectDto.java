package edu.kit.cbc.Models;

import io.micronaut.data.annotation.GeneratedValue;
import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
@MappedEntity
public record ReadProjectDto (@Id @GeneratedValue(GeneratedValue.Type.AUTO) Long id, String name, String dateCreated, DirectoryDto files) { }
