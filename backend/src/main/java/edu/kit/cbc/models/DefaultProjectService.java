package edu.kit.cbc.models;

import java.util.Set;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import jakarta.inject.Singleton;
import jakarta.validation.constraints.NotBlank;

@Singleton
class DefaultProjectService implements ProjectService {
    private final ProjectRepository projectRepository;

    public DefaultProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ReadProjectDto create(CreateProjectDto project) {
        return projectRepository.save(
            new ReadProjectDto(
                null,
                project.name(),
                ZonedDateTime
                    .now(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_INSTANT),
                new DirectoryDto(
                    "",
                    Set.of()
                )
            )
        );
    }

    public ReadProjectDto updateById(@NotBlank String id, ReadProjectDto project) {
        return projectRepository.update(project);
    }

    public ReadProjectDto updateById(@NotBlank String id, CreateProjectDto project) {
        ReadProjectDto tmp = findById(id);
        return projectRepository.update(
            new ReadProjectDto(
                tmp.id(),
                project.name(),
                tmp.dateCreated(),
                tmp.files()
            )
        );
    }

    public ReadProjectDto findById(@NotBlank String id) {
        return projectRepository.findById(id).orElseThrow();
    }

    public void deleteById(@NotBlank String id) {
        projectRepository.deleteById(id);
    }
}
