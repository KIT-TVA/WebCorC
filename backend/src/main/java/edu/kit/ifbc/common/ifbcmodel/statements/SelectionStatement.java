package edu.kit.ifbc.common.ifbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import io.micronaut.serde.annotation.Serdeable;

import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Serdeable
public class SelectionStatement extends AbstractIFbCStatement {
    private List<Condition> guards;
    private List<AbstractIFbCStatement> commands;
    private boolean isPreProven;

    @Override
    public VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) throws VariableParsingException {
        List<String[]> usedVariables = new LinkedList<>();

        for (Condition guard : guards) {
            usedVariables.add(getRelevantVariablesInCondition(guard, preVariableState));
        }

        Set<String> usedVariablesSet = new HashSet<>();
        for (String[] variables : usedVariables) {
            for (String variable : variables) {
                usedVariablesSet.add(variable);
            }
        } 
        Lattice.Level lub = lattice.leastUpperBound(preVariableState.levelOf(lattice.getMinimalLevel(), usedVariablesSet.toArray(new String[usedVariablesSet.size()])));
        Lattice.Level contextLevel = lattice.leastUpperBound(lub, level);


        List<VariableState> states = new LinkedList<>();
        for (AbstractIFbCStatement statement : commands) {
            context.handleChild(statement.getId());
            states.add(statement.calculatePostVariableState(lattice, contextLevel, preVariableState, context));
            context.finishChild();
        }
        VariableState finalPostState = states.stream().reduce((a,b) -> a.withEachLub(lattice, b)).get();
        context.setInfo(finalPostState, contextLevel);
        return finalPostState;
    }
}
