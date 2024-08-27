package edu.kit.cbc.models;

import jakarta.inject.Singleton;
import jakarta.validation.constraints.NotBlank;

@Singleton
class DefaultProjectService implements ProjectService {
    private final ProjectRepository projectRepository;

    public DefaultProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ReadProjectDto save(ReadProjectDto project) {
        return projectRepository.save(project);
    }

    public ReadProjectDto findById(@NotBlank String id) {
        return projectRepository.findById(id).orElseThrow();
    }
}
