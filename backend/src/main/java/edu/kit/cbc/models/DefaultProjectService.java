package edu.kit.cbc.models;

import jakarta.inject.Singleton;

@Singleton
class DefaultProjectService implements ProjectService {
    private final ProjectRepository projectRepository;

    public DefaultProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ReadProjectDto save(ReadProjectDto project) {
        return projectRepository.save(project);
    }
}
