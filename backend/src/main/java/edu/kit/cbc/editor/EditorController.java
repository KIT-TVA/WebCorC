package edu.kit.cbc.editor;

import com.fasterxml.jackson.core.JsonProcessingException;
import edu.kit.cbc.common.CbCFormulaContainer;
import edu.kit.cbc.common.Problem;
import edu.kit.cbc.common.corc.VerifyAllStatements;
import edu.kit.cbc.common.corc.codegen.CodeGenerator;
import edu.kit.cbc.editor.llm.LLMQueryDto;
import edu.kit.cbc.editor.llm.LLMResponse;
import edu.kit.cbc.editor.llm.OpenAIClient;
import edu.kit.cbc.projects.files.controller.FilesController;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.http.server.types.files.StreamedFile;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.validation.Valid;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;


@Controller("/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    private final FilesController filesController;
    private final FormulaParser parser;
    private final OpenAIClient openai;

    EditorController(FilesController filesController, FormulaParser parser, OpenAIClient openai) {
        this.filesController = filesController;
        this.parser = parser;
        this.openai = openai;
    }

    @Post(uri = "/export")
    @Produces(MediaType.APPLICATION_ZIP)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<String> export() {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED"));
    }

    @Post(uri = "/generate")
    @Produces(MediaType.APPLICATION_ZIP)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<String> generate() {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED"));
    }

    @Post(uri = "/xmltojson")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.ALL)
    public HttpResponse<?> xmltojson(@Body String cbcFormulaString) {
        try {
            CbCFormulaContainer c = parser.fromXMLStringToCbC(cbcFormulaString);
            return HttpResponse.ok(parser.toJsonString(c));
        } catch (IOException e) {
            return HttpResponse.serverError(Problem.getParsingError(e.getMessage()));
        }
    }

    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@QueryValue Optional<String> projectId, @Body String cbcFormulaString) {
        try {
            CbCFormulaContainer formula = parser.fromJsonStringToCbC(cbcFormulaString);
            Path proofFolderPath;
            Path proofFilePath;
            try {
                proofFolderPath = Files.createTempDirectory("proof_");
                proofFilePath = Files.createDirectory(proofFolderPath.resolve("prove_"));
                if (projectId.isPresent()) {
                    //obtaining java files and helper.key from project before verification
                    List<String> filePaths = new LinkedList<>(filesController.findJavaFilesOfProject(projectId.get()));
                    filePaths.add("helper.key");
                    for (String filePath : filePaths) {
                        Optional<HttpResponse<StreamedFile>> response = filesController.getFile(projectId.get(), URI.create(filePath));
                        if (response.isPresent()) {
                            InputStream e = response.get().body().getInputStream();
                            Path fullPath = proofFilePath.resolve(filePath);
                            Files.createDirectories(fullPath.getParent());
                            Files.copy(e, fullPath);
                        }
                    }
                }
                VerifyAllStatements.verify(formula.cbcFormula(), formula.javaVariables(), formula.globalConditions(), formula.renaming(), proofFolderPath.toUri());
            } catch (IOException e) {
                return HttpResponse.serverError(e.getMessage());
            }

            //find all key files except helper.key
            List<Path> keyFiles;
            try {
                keyFiles = Files.find(proofFilePath, 30, (path, attributes) -> {
                    String pathStr = path.toString();
                    return
                            pathStr.endsWith(".key")
                                    && !pathStr.endsWith("helper.key");
                }).toList();
            } catch (IOException e) {
                return HttpResponse.serverError(e.getMessage());
            }

            //upload found files to project
            projectId.ifPresent(s -> keyFiles.forEach(path -> {
                URI urn = URI.create(proofFolderPath.getFileName() + path.toString().replace(proofFilePath.toString(), ""));
                try {
                    filesController.uploadBytes(Files.readAllBytes(path), s, urn);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }));

            return HttpResponse.ok(parser.toJsonString(formula));
        } catch (JsonProcessingException e) {
            return HttpResponse.serverError(Problem.getParsingError(e.getMessage()));
        }
    }

    @Post(uri = "/javaGen")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> javaGen(@QueryValue Optional<String> projectId, @Body String cbcFormulaString) {
        try {
            CbCFormulaContainer formula = parser.fromJsonStringToCbC(cbcFormulaString);

            return HttpResponse.ok(CodeGenerator.instance.generateCodeFor(formula));
        } catch (JsonProcessingException e) {
            return HttpResponse.serverError(Problem.getParsingError(e.getMessage()));
        }
    }

    @Get(uri = "/jobs/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> getJobs(long id) {
        //TODO: Websocket
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }

    @Post(uri = "/askquestion")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<LLMResponse> askQuestion(@Body @Valid LLMQueryDto query) {
        return HttpResponse.ok(openai.sendQuery(query));
    }
}
