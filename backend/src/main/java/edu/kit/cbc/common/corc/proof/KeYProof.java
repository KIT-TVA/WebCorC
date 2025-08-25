package edu.kit.cbc.common.corc.proof;

import de.uka.ilkd.key.proof.Proof;
import edu.kit.cbc.common.corc.KeYInteraction;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import io.micronaut.serde.annotation.Serdeable;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Builder;

@Builder
@Serdeable
public class KeYProof {

    private static final String KEY_HEADER = """
        \\programVariables {
            %s
        Heap heapAtPre;}
        """;

    private static final String KEY_BODY = """
        \\problem{(
            %s
            %s
            & wellFormed(heap)) -> {heapAtPre := heap}
        \\<{%s;}\\>
        (%s)
        }
        """;

    private static final String PROGRAM_VARIABLE_SEPARATOR = "; ";
    private static final String GLOBAL_CONDITIONS_SEPARATOR = " & ";

    private final List<Path> includedFiles;
    private final List<Path> javaSrcFiles;
    private final List<Path> existingProofFiles;
    private final Path proofFolder;
    private final Condition preCondition;
    private final Condition postCondition;
    private final String statementName;
    private final String programStatement;
    private final List<JavaVariable> programVariables;
    private final List<Condition> globalConditions;

    public boolean execute() {
        try {
            File keyFile = this.createProofFile();
            Proof proof = KeYInteraction.startKeyProof(keyFile, false);
            return proof != null && proof.closed();
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    private File createProofFile() throws IOException {
        Path tmpDir = Files.createTempDirectory(proofFolder, statementName);

        int currentProofNumber = 0;
        Path keyFilePath = tmpDir.resolve(String.format("%s_%d.key", statementName, currentProofNumber));

        while (isIllegalFilePath(keyFilePath)) {
            keyFilePath = tmpDir.resolve(String.format("%s_%d.key", statementName, currentProofNumber++));
        }

        Path keyFile = Files.createFile(keyFilePath);
        Files.write(keyFile, this.toString().getBytes());
        return keyFile.toFile();
    }

    private boolean isIllegalFilePath(Path keyFilePath) {
        return Files.exists(keyFilePath) || this.existingProofFiles.stream().map(Path::getFileName)
            .anyMatch(name -> name.equals(keyFilePath.getFileName()));
    }

    @Override
    public String toString() {
        return this.printKeYHeader() + printKeYBody();
    }

    private String printKeYHeader() {
        return String.format(KEY_HEADER, printProgramVariables());
    }

    private String printKeYBody() {
        return String.format(
            KEY_BODY,
            preCondition.asJML(),
            printGlobalConditions(),
            programStatement,
            postCondition.asJML()
        );
    }

    private String printProgramVariables() {
        return this.programVariables.stream().map(JavaVariable::toString)
            .collect(Collectors.joining(PROGRAM_VARIABLE_SEPARATOR));
    }

    private String printGlobalConditions() {
        return this.globalConditions.stream().map(Condition::toString)
            .collect(Collectors.joining(GLOBAL_CONDITIONS_SEPARATOR));
    }
}
