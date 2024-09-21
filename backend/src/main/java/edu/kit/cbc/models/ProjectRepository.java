package edu.kit.cbc.models;

import io.micronaut.data.mongodb.annotation.MongoRepository;
import io.micronaut.data.repository.CrudRepository;

@MongoRepository
public interface ProjectRepository extends CrudRepository<ReadProjectDto, String> { }
