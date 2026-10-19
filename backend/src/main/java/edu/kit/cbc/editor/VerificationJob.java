package edu.kit.cbc.editor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.cbc.common.corc.FileUtil;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.proof.ProofContext;
import edu.kit.cbc.editor.verifier.ResolvedVerifier;
import edu.kit.cbc.editor.verifier.Verifier;
import edu.kit.cbc.editor.verifier.VerifierCatalog;
import edu.kit.cbc.editor.verifier.VerifierCatalogService;
import edu.kit.cbc.editor.verifier.VerifierOverride;
import edu.kit.cbc.editor.verifier.job.NarrowedProgram;
import edu.kit.cbc.editor.verifier.job.SourceFile;
import edu.kit.cbc.projects.files.controller.FilesController;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletionStage;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import lombok.Getter;

/**
 * One verification job: every catalog Verifier's entry reset first, then functional verification,
 * then — only on its success, and unless {@code functionalOnly} — the fan-out to the enabled
 * Verifiers. The final {@code complete} is sent exactly once, last, and is the moment the result
 * becomes available.
 *
 * <p>Messages are emitted from this thread and the fan-out's threads alike, hence the lock; a
 * listener is invoked under it and must return promptly.
 */
public class VerificationJob extends Thread {

    private static final String VERIFIERS_FILE_URN = ".internal/verifiers.json";
    private static final ObjectMapper VERIFIERS_MAPPER = new ObjectMapper();
    private static final String FUNC = VerifierCatalogService.FUNCTIONAL_VERIFIER_ID;

    private final Object lock = new Object();
    private final List<VerificationMessage> messages = new ArrayList<>();
    private final List<Function<VerificationMessage, Boolean>> listeners = new ArrayList<>();
    @Getter private volatile boolean hasResult = false;

    private final UUID jobId;
    private final ProofContext.ProofContextBuilder context;
    private final Optional<String> projectId;
    private final boolean functionalOnly;
    @Getter private final CbCFormula formula;
    private final FilesController filesController;
    private final VerifierFanOut fanOut;
    private final CompletionStage<VerifierCatalog> catalog;
    private final Map<String, VerifierOverride> verifierOverrides;
    private final Runnable onFinished;

    private static final Logger LOGGER = Logger.getGlobal();

    VerificationJob(
        UUID jobId,
        Optional<String> projectId,
        boolean functionalOnly,
        CbCFormula formula,
        FilesController filesController,
        VerifierFanOut fanOut,
        CompletionStage<VerifierCatalog> catalog,
        Runnable onFinished
    ) throws IOException {
        this.jobId = jobId;
        this.projectId = projectId;
        this.functionalOnly = functionalOnly;
        this.formula = formula;
        this.filesController = filesController;
        this.fanOut = fanOut;
        this.catalog = catalog;
        this.onFinished = onFinished;

        Path proofFolder = Files.createTempDirectory(projectId.isPresent() ? "proof_" + projectId.get() : "proof");

        Map<String, VerifierOverride> overrides = new HashMap<>();
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

            if (!functionalOnly) {
                overrides = loadVerifierOverrides(projectId.get(), filesController);
            }
        }
        this.verifierOverrides = overrides;
        context.verifierOverrides(overrides);
        orchestrationLog("verification initialized");
    }

    /**
     * Loads the user's verifier overrides from {@code .internal/verifiers.json}. A missing or
     * unparsable file is not fatal to verification: it is treated as no overrides, with a
     * warning logged for the parse-failure case.
     */
    private static Map<String, VerifierOverride> loadVerifierOverrides(String projectId, FilesController filesController)
        throws IOException {
        Optional<byte[]> raw = filesController.retrieveFileBytes(projectId, VERIFIERS_FILE_URN);
        if (raw.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return VERIFIERS_MAPPER.readValue(raw.get(), new TypeReference<Map<String, VerifierOverride>>() {});
        } catch (IOException e) {
            LOGGER.warning(String.format(
                "Failed to parse %s for project %s: %s. Continuing without verifier overrides.",
                VERIFIERS_FILE_URN, projectId, e.getMessage()));
            return new HashMap<>();
        }
    }

    public void run() {
        final long start = System.nanoTime();
        orchestrationLog("starting " + FUNC);

        // One instance per run, created before the functional proof: the reset of every catalog
        // Verifier's entry happens up front, in both modes, so that no verdict of an earlier run
        // can survive any outcome of this one.
        NarrowedProgram program = NarrowedProgram.of(formula);
        List<String> enabledIds = resetVerifierEntries(program);

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

        log("functional verification complete");
        if (proven) {
            log("all statements were proven successfully!");
        } else {
            log("WebCorC was unable to prove all of your statements. See the log for further information...");
        }
        emit(VerificationMessage.done(FUNC, proven, elapsedMs(start)));

        // The func entry always reflects *this* run's functional result, in both modes and even
        // on failure -- written now, before the gate below, so a stale proven:true from an
        // earlier run can never be mistaken for a fresh isProven:false.
        program.writeFunctionalResult();
        program.writeFormulaFunctionalResult();

        if (proven && !functionalOnly) {
            try {
                callVerifiers(program);
            } catch (RuntimeException e) {
                // Whatever went wrong, the job must still complete or the frontend waits forever.
                LOGGER.log(Level.SEVERE, "Fan-out of job " + jobId + " failed unexpectedly", e);
                orchestrationLog("calling the Verifiers failed unexpectedly: " + e.getMessage());
            }
        } else if (!proven) {
            // The functional gate keeps every enabled Verifier from running.
            program.markDisabled(enabledIds);
        }

        hasResult = true;
        emit(VerificationMessage.complete(elapsedMs(start)));

        //Keep job output and result available for some time before it is deleted
        try {
            Thread.sleep(Duration.ofMinutes(60));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        onFinished.run();
    }

    /**
     * Resets every catalog Verifier's entry, before functional verification and in both modes, so
     * that nothing of an earlier run can survive this one's outcome. Needs the Catalog even
     * functional-only (for the ids to mark disabled). A failure here is a bug, not an expected
     * state — the Catalog the job joins is the one the frontend already fetched — so it is only
     * reported and the run continues functionally.
     *
     * @return the ids of the enabled Verifiers that were reset; empty if the reset failed
     */
    private List<String> resetVerifierEntries(NarrowedProgram program) {
        try {
            VerifierCatalog resolvedCatalog = catalog.toCompletableFuture().join();
            List<ResolvedVerifier> enabled = enabledVerifiers(resolvedCatalog);
            List<String> enabledIds = enabled.stream().map(ResolvedVerifier::id).toList();
            List<String> disabledIds = resolvedCatalog.verifiers().stream()
                .map(Verifier::id)
                .filter(id -> !FUNC.equals(id))
                .filter(id -> !enabledIds.contains(id))
                .toList();
            program.resetForRun(enabled, disabledIds);
            return enabledIds;
        } catch (RuntimeException e) {
            LOGGER.log(Level.SEVERE, "Resetting the Verifier entries of job " + jobId + " failed", e);
            orchestrationLog("resetting the Verifier entries failed; every Verifier entry keeps what the last run left it: "
                + e.getMessage());
            return List.of();
        }
    }

    /** The Verifiers that run in this job — none at all functional-only, where no Override is consulted. */
    private List<ResolvedVerifier> enabledVerifiers(VerifierCatalog resolvedCatalog) {
        if (functionalOnly) {
            return List.of();
        }
        return ResolvedVerifier.enabled(resolvedCatalog, verifierOverrides);
    }

    /**
     * Calls every Verifier the Overrides mark enabled, if any. {@code isProven} is recomputed
     * ({@link NarrowedProgram#recomputeIsProven}) in a {@code finally}, so no path out of this
     * method -- happy, early-return, or an unexpected exception -- skips it, using
     * {@code enabledIds} as far as it got computed before any failure. The entries themselves
     * were reset before functional verification ({@link #resetVerifierEntries}), not here.
     */
    private void callVerifiers(NarrowedProgram program) {
        Set<String> enabledIds = Set.of();
        try {
            VerifierCatalog resolvedCatalog = catalog.toCompletableFuture().join();
            List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(resolvedCatalog, verifierOverrides);
            enabledIds = verifiers.stream().map(ResolvedVerifier::id).collect(Collectors.toSet());

            if (verifiers.isEmpty()) {
                orchestrationLog("no other Verifier is enabled");
                return;
            }
            orchestrationLog("calling " + verifiers.stream().map(ResolvedVerifier::id).collect(Collectors.joining(", ")));
            fanOut.run(jobId, program, sourceFiles(), verifiers, this::emit);
        } finally {
            program.recomputeIsProven(enabledIds);
        }
    }

    /**
     * The same Java sources and KeY includes functional verification works with, read afresh
     * from the project. Files that cannot be read are reported and left out rather than failing
     * every Verifier.
     */
    private List<SourceFile> sourceFiles() {
        if (projectId.isEmpty()) {
            return List.of();
        }
        List<SourceFile> files = new ArrayList<>();
        try {
            filesController.readFiles(projectId.get(), ".java", "javaSrc").forEach((path, content) -> files.add(new SourceFile(path, content)));
            filesController.readFiles(projectId.get(), ".key", "include").forEach((path, content) -> files.add(new SourceFile(path, content)));
        } catch (IOException | RuntimeException e) {
            LOGGER.warning(String.format("Project %s: files could not be read for the Verifiers: %s", projectId.get(), e.getMessage()));
            orchestrationLog("the project's files could not be read and are not sent to the Verifiers: " + e.getMessage());
        }
        return files;
    }

    /**
     * Delivers every message sent so far, then every later one as it is sent — in order, without
     * duplicates. A listener returning {@code true} (its connection is gone) is dropped.
     */
    public void subscribe(Function<VerificationMessage, Boolean> listener) {
        synchronized (lock) {
            for (VerificationMessage message : messages) {
                if (listener.apply(message)) {
                    return;
                }
            }
            listeners.add(listener);
        }
    }

    private void log(String message) {
        emit(VerificationMessage.log(FUNC, message));
    }

    /**
     * Emits a line about the job's own orchestration (not attributable to any Verifier,
     * including the Functional Verifier): sent with no {@code verifier} tag, so the frontend
     * prints it without a {@code [name]} prefix.
     */
    private void orchestrationLog(String message) {
        emit(VerificationMessage.log(null, message));
    }

    private void emit(VerificationMessage message) {
        synchronized (lock) {
            messages.add(message);
            listeners.removeIf(listener -> listener.apply(message));
        }
    }

    /** Wall-clock time since {@code start} ({@link System#nanoTime()}), in whole milliseconds. */
    private static long elapsedMs(long start) {
        return (System.nanoTime() - start) / 1_000_000;
    }
}
