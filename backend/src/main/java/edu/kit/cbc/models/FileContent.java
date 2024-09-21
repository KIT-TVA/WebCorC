package edu.kit.cbc.models;

import java.net.URI;

import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
@MappedEntity
public record FileContent(@Id String projectId, @Id URI urn, String content) { }

