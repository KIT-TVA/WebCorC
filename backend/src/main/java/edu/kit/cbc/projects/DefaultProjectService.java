package edu.kit.cbc.projects;

import edu.kit.cbc.projects.files.dto.DirectoryDto;
import jakarta.inject.Singleton;
import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;

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
                                Set.of())));
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
                        tmp.files()));
    }

    public ReadProjectDto findById(@NotBlank String id) {
        return projectRepository.findById(id).orElseThrow();
    }

    public boolean existsById(@NotBlank String id) {
        return projectRepository.existsById(id);

    }

    public void addFilePathToId(@NotBlank String id, URI urn) {
        ReadProjectDto project = findById(id);
        project.files().addFilePath(urn);
        updateById(id, project);
    }

    public void removeFilePathFromId(@NotBlank String id, URI urn) {
        ReadProjectDto project = findById(id);
        project.files().removeFilePath(urn);
        updateById(id, project);
    }

    public void deleteById(@NotBlank String id) {
        projectRepository.deleteById(id);
    }
}
