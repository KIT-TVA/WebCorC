package edu.kit.cbc.common.corc.proof;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import java.nio.file.Path;
import java.util.List;
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
}
