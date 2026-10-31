package edu.kit.cbc.common.corc.proof;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.editor.verifier.VerifierOverride;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public final class ProofContext {

    private final CbCFormula cbCFormula;
    private final Path proofFolder;
    private final List<Path> includeFiles;
    private final List<Path> javaSrcFiles;
    private final List<Path> existingProofFiles;
    private final Consumer<String> logger;
    private final Map<String, VerifierOverride> verifierOverrides;
}
