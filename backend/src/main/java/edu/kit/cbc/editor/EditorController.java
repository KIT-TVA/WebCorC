package edu.kit.cbc.editor;

import edu.kit.cbc.common.corc.FileUtil;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.proof.ProofContext;
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
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.validation.Valid;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Controller("/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    private final FilesController filesController;
    private final OpenAIClient openai;

    EditorController(FilesController filesController, OpenAIClient openai) {
        this.filesController = filesController;
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
        return HttpResponse.serverError("NOT IMPLEMENTED ");
    }

    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@QueryValue Optional<String> projectId, @Body @Valid CbCFormula formula)
        throws IOException {

        ProofContext.ProofContextBuilder context = ProofContext.builder();
        context.cbCFormula(formula);

        Path proofFolder = Files.createTempDirectory(projectId.isPresent() ? "proof_" + projectId.get() : "proof");

        context.proofFolder(proofFolder);
        context.includeFiles(new ArrayList<>());
        context.javaSrcFiles(new ArrayList<>());
        context.existingProofFiles(new ArrayList<>());

        if (projectId.isPresent()) {
            List<Path> includeFiles = filesController.retrieveFiles(projectId.get(), ".key", "include");
            List<Path> javaSrcFiles = filesController.retrieveFiles(projectId.get(), ".java", "javaSrc");

            List<Path> existingKeyFiles = filesController.retrieveFiles(projectId.get(), ".key", "proofs");

            System.out.println("Included KeY-Files: " + includeFiles);
            System.out.println("Included Java-Files: " + javaSrcFiles);
            System.out.println("Existing Proof-Files: " + existingKeyFiles);
            context.includeFiles(includeFiles);
            context.javaSrcFiles(javaSrcFiles);
            context.existingProofFiles(existingKeyFiles);
        }

        formula.setProven(formula.getStatement().prove(context.build()));

        if (projectId.isPresent()) {
            List<Path> proofFiles;
            proofFiles = Files.find(proofFolder, 10, (path, attributes) -> {
                String pathStr = path.toString();
                return pathStr.endsWith(".key") || pathStr.endsWith(".proof");
            }).toList();

            for (Path projectFile : proofFiles) {
                String statementName = projectFile.getFileName().toString().split("_")[0];
                Path uploadPath = Path.of("proofs/" + statementName + "/");
                uploadPath = uploadPath.resolve(projectFile.getFileName().toString());
                filesController.uploadBytes(Files.readAllBytes(projectFile), projectId.get(), uploadPath);
            }

        }

        FileUtil.deleteDirectory(proofFolder);

        if (projectId.isPresent()) {
            context.build().getIncludeFiles().stream().findFirst().ifPresent(includeFile -> {
                try {
                    FileUtil.deleteDirectory(includeFile.getParent());
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });

            context.build().getJavaSrcFiles().stream().findFirst().ifPresent(javaSrcFile -> {
                try {
                    FileUtil.deleteDirectory(javaSrcFile.getParent());
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });

            context.build().getExistingProofFiles().stream().findFirst().ifPresent(existingKeyFile -> {
                try {
                    FileUtil.deleteDirectory(existingKeyFile.getParent().getParent());
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });
        }

        return HttpResponse.ok(formula);
    }


    @Post(uri = "/javaGen")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> javaGen(@QueryValue Optional<String> projectId, @Body String cbcFormulaString) {
        return HttpResponse.serverError("NOT IMPLEMENTED");
    }

    @Get(uri = "/jobs/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> getJobs(long id) {
        // TODO: Websocket
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }

    @Post(uri = "/askquestion")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<LLMResponse> askQuestion(@Body @Valid LLMQueryDto query) {
        return HttpResponse.ok(openai.sendQuery(query));
    }
}
