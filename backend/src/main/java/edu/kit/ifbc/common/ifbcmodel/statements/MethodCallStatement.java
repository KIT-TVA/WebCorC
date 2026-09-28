package edu.kit.ifbc.common.ifbcmodel.statements;

import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;

import java.util.HashMap;
import java.util.logging.Logger;

import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class MethodCallStatement extends AbstractIFbCStatement {
    private final static Logger LOGGER = Logger.getGlobal();

    private String methodName;
    private HashMap<String, String> parameterMapping;

    private AbstractIFbCStatement resolveMethod(String methodName) {
        throw new UnsupportedOperationException("TODO: Implement");
    }

    @Override
    public VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) throws VariableParsingException { 
        // TODO in future implementation:
        // Derive the correct values somewhere based on the method name:
        VariableState methodPreVariableState = new VariableState(new HashMap<>());
        AbstractIFbCStatement method = resolveMethod(methodName);
        VariableState actualMethodPreVariableState = new VariableState(new HashMap<>());

        // Build a pre variable state for the method by mapping the parameters and building the lub
        for (String a : parameterMapping.keySet()) {
            String z = parameterMapping.get(a);
            Lattice.Level _level = lattice.leastUpperBound(
                preVariableState.levelOf(a, lattice.getMinimalLevel()),
                methodPreVariableState.levelOf(z, lattice.getMinimalLevel())
            );
            actualMethodPreVariableState = actualMethodPreVariableState.with(z, _level);
        }
        // Calculate the post variable state of the method
        VariableState methodPostVariableState = method.calculatePostVariableState(lattice, level, actualMethodPreVariableState, context);
        // Build the final post variable state for this statement by remapping the parameters
        VariableState postVariableState = new VariableState(new HashMap<>());
        for (String a : parameterMapping.keySet()) {
            String z = parameterMapping.get(a);
            postVariableState = postVariableState.with(a, methodPostVariableState.levelOf(z, lattice.getMinimalLevel()));
        }
        context.setInfo(postVariableState, level);
        return preVariableState;
    }
}
