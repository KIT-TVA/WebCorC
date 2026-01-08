package edu.kit.cbc.editor;

import edu.kit.cbc.common.corc.FileUtil;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.proof.ProofContext;
import edu.kit.cbc.projects.files.controller.FilesController;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.logging.Logger;
import java.util.stream.Stream;
import lombok.Getter;

public class VerificationJob extends Thread {

    private static final String LOGGER_FORMAT = "%s %s\n";

    @Getter private String log;
    @Getter private boolean hasResult = false;
    private HashSet<Function<String, Boolean>> listeners;

    private ProofContext.ProofContextBuilder context;
    private Optional<String> projectId;
    @Getter private CbCFormula formula;
    private FilesController filesController;
    private Runnable onFinished;

    private static final Logger LOGGER = Logger.getGlobal();

    VerificationJob(Optional<String> projectId, CbCFormula formula, FilesController filesController, Runnable onFinished) throws IOException {
        log = "";
        listeners = new HashSet<Function<String, Boolean>>();
        this.projectId = projectId;
        this.formula = formula;
        this.filesController = filesController;
        this.onFinished = onFinished;

        Path proofFolder = Files.createTempDirectory(projectId.isPresent() ? "proof_" + projectId.get() : "proof");

        context = ProofContext.builder()
            .cbCFormula(formula)
            .proofFolder(proofFolder)
            .includeFiles(new ArrayList<>())
            .javaSrcFiles(new ArrayList<>())
            .existingProofFiles(new ArrayList<>())
            .logger((msg) -> log(msg));

        if (projectId.isPresent()) {
            List<Path> includeFiles = filesController.retrieveFiles(projectId.get(), ".key", "include");
            List<Path> javaSrcFiles = filesController.retrieveFiles(projectId.get(), ".java", "javaSrc");
            List<Path> existingKeyFiles = filesController.retrieveFiles(projectId.get(), ".key", "proofs");

            LOGGER.info("Included KeY-Files: " + includeFiles);
            LOGGER.info("Included Java-Files: " + javaSrcFiles);
            LOGGER.info("Existing Proof-Files: " + existingKeyFiles);
            context.includeFiles(includeFiles);
            context.javaSrcFiles(javaSrcFiles);
            context.existingProofFiles(existingKeyFiles);
        }
        log("verification initialized");
    }

    public void run() {
        log("verification started");
        boolean proven = formula.getStatement().prove(context.build());
        formula.setProven(proven);

        Path proofFolder = context.build().getProofFolder();
        if (projectId.isPresent()) {
            try {
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
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        try {
            FileUtil.deleteDirectory(proofFolder);
        } catch (IOException e) {
            e.printStackTrace();
        }

        if (projectId.isPresent()) {
            Consumer<Path> delete = (p) -> {
                try {
                    FileUtil.deleteDirectory(p.getParent());
                } catch (IOException e) {
                    e.printStackTrace();
                }
            };
            context.build().getIncludeFiles().stream().findFirst().ifPresent(delete);
            context.build().getJavaSrcFiles().stream().findFirst().ifPresent(delete);
            context.build().getExistingProofFiles().stream().findFirst().ifPresent(existingKeyFile -> {
                delete.accept(existingKeyFile.getParent());
            });
        }

        hasResult = true;
        log("verification complete");
        if (proven) {
            log("all statements were proven successfully!");
        } else {
            log("WebCorC was unable to prove all of your statements. See the log for further information...");
        }

        //Keep job output and result available for some time before it is deleted
        try {
            Thread.sleep(Duration.ofMinutes(60));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        onFinished.run();
    }

    public void addListener(Function<String, Boolean> listener) {
        listeners.add(listener);
    }

    private void log(String message) {
        log += String.format(LOGGER_FORMAT, this.getCurrentTimestamp(), message);

        //Call all listeners. The listener returns true if it detects that its WebSocket connection was closed,
        //so it will be removed from the listener pool
        listeners.removeIf(l -> l.apply(message));
    }

    private String getCurrentTimestamp() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("'['HH:mm:ss']'");
        return LocalTime.now().format(formatter);
    }

    private void listDirectory(Path dir) {
        System.out.println("LISTING DIRECTORY: " + dir);
        if (!Files.exists(dir) || !Files.isDirectory(dir)) {
            System.out.println("Error: Path is not a valid directory: " + dir);
            return;
        }

        try (Stream<Path> stream = Files.list(dir)) {

            stream.forEach(path -> {
                String fileName = path.getFileName().toString();
                if (Files.isDirectory(path)) {
                    fileName += "/";
                }
                System.out.println(fileName);
            });

        } catch (IOException e) {
            System.err.println("Failed to read directory: " + e.getMessage());
        }
    }
}
