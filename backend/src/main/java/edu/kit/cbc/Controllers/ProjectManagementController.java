package edu.kit.cbc.Controllers;

import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.List;

import edu.kit.cbc.Models.CreateProjectDto;
import edu.kit.cbc.Models.DirectoryDto;
import edu.kit.cbc.Models.FileDto;
import edu.kit.cbc.Models.FileType;
import edu.kit.cbc.Models.ReadProjectDto;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.Put;
import io.micronaut.http.annotation.QueryValue;

@Controller("/projects")
public class ProjectManagementController {
    @Post
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<ReadProjectDto> createProject(@Body CreateProjectDto project) {
        //TODO: Input validation
        return HttpResponse.ok(
            new ReadProjectDto(
                2134L,
                project.name(),
                ZonedDateTime
                    .now(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_INSTANT),
                new DirectoryDto(
                    "/",
                    List.of(
                        new FileDto("diag.diag", FileType.diagram),
                        new DirectoryDto(
                            "/aisdbns/",
                            List.of(
                                new FileDto("somefile1", FileType.diagram),
                                new DirectoryDto(
                                    "/aisdbns/",
                                    List.of()),
                                new FileDto("somefile2", FileType.java),
                                new FileDto("somefile3", FileType.prove)
                            )
                        )
                    )
                )
            )
        );
    }

    @Get(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> getProject(long id) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }

    @Put(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<ReadProjectDto> modifyProject(@QueryValue String id, @Body CreateProjectDto project) {
        //TODO: Input validation
        return HttpResponse.ok(
            new ReadProjectDto(
                213512L,
                project.name(),
                ZonedDateTime
                    .now(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_INSTANT),
                new DirectoryDto(
                    "/",
                    List.of(
                        new FileDto("diag.diag", FileType.diagram),
                        new DirectoryDto(
                            "/aisdbns/",
                            List.of(
                                new FileDto("somefile1", FileType.diagram),
                                new DirectoryDto(
                                    "/aisdbns/",
                                    List.of()),
                                new FileDto("somefile2", FileType.java),
                                new FileDto("somefile3", FileType.prove)
                            )
                        )
                    )
                )
            )
        );
    }

    @Delete(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> deleteProject(long id) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }
}
