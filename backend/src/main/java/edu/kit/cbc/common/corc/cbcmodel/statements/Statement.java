package edu.kit.cbc.common.corc.cbcmodel.statements;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.program.ProgramLexer;
import edu.kit.cbc.common.corc.parsing.program.ProgramParser;
import edu.kit.cbc.common.corc.parsing.program.ProgramPrinter;
import edu.kit.cbc.common.corc.proof.KeYProof;
import edu.kit.cbc.common.corc.proof.KeYProofGenerator;
import edu.kit.cbc.common.corc.proof.ProofContext;
import io.micronaut.serde.annotation.Serdeable;
import lombok.Data;

@Data
@Serdeable
public class Statement extends AbstractStatement {

    private String programStatement;
    @JsonIgnore
    private Tree programTree;

    public void setProgramStatement(String programStatement) {
        this.programStatement = programStatement;
        Lexer lexer = ProgramLexer.forString(programStatement);
        TokenSource source = new TokenSource(lexer);
        ProgramParser parser = new ProgramParser(source);
        this.programTree = parser.parse();
    }

    @Override
    public boolean prove(ProofContext proofContext) {
        KeYProofGenerator proofGenerator = new KeYProofGenerator(proofContext);
        KeYProof proof = proofGenerator.generateStatement(this);

        this.isProven = proof.execute();

        return this.isProven();
    }

    @Override
    public String generate() {
        return ProgramPrinter.print(programTree);
    }
}
