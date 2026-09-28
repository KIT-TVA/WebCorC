package edu.kit.ifbc.common.ifbcmodel.statements;

import java.util.Arrays;
import java.util.logging.Logger;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.StatementType;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsing;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.program.ProgramLexer;
import edu.kit.cbc.common.corc.parsing.program.ProgramParser;
import io.micronaut.serde.annotation.Serdeable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Serdeable
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = Statement.class, name = "STATEMENT"),
    @JsonSubTypes.Type(value = CompositionStatement.class, name = "COMPOSITION"),
    @JsonSubTypes.Type(value = ReturnStatement.class, name = "RETURN"),
    @JsonSubTypes.Type(value = SelectionStatement.class, name = "SELECTION"),
    @JsonSubTypes.Type(value = SkipStatement.class, name = "SKIP"),
    @JsonSubTypes.Type(value = SmallRepetitionStatement.class, name = "REPETITION"),
    @JsonSubTypes.Type(value = MethodCallStatement.class, name = "METHODCALL")
})
public abstract class AbstractIFbCStatement {

    private final static Logger LOGGER = Logger.getGlobal();

    private String id;
    private String name;
    private StatementType type;
    private Condition preCondition;
    private Condition postCondition;

    public abstract VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) throws VariableParsingException;

    public String[] getRelevantVariablesInCondition(Condition condition, VariableState variables) throws VariableParsingException {
        return VariableParsing.getRelevantVariables(condition.getParsedCondition(), variables.getVariableSet());
    }

    public String[] getRelevantVariablesInStatement(String programm, VariableState variables) throws VariableParsingException {
        Lexer lexer = ProgramLexer.forString(programm);
        TokenSource source = new TokenSource(lexer);
        ProgramParser parser = new ProgramParser(source);
        LOGGER.fine("Variables: \t" + variables.getVariableSet() + " program: " + programm);
        String[] value = VariableParsing.getRelevantVariables(parser.parse(), variables.getVariableSet());
        LOGGER.fine("relevant variables: " + Arrays.toString(value));
        return value;
    }

    public String[] getRelevantVariablesInStatement(Tree programm, VariableState variables) throws VariableParsingException {
        LOGGER.fine("Variables: \t" + variables.getVariableSet() + " program: " + programm);
        String[] value = VariableParsing.getRelevantVariables(programm, variables.getVariableSet());
        LOGGER.fine("relevant variables: " + Arrays.toString(value));
        return value;
    }


}
