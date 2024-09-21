package edu.kit.cbc.models;

import io.micronaut.data.annotation.GeneratedValue;
import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
@MappedEntity
public record ReadProjectDto (@Id @GeneratedValue(GeneratedValue.Type.AUTO) String id, String name, String dateCreated, DirectoryDto files) { }
