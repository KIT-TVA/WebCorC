package edu.kit.ifbc.common.ifbcmodel;

import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import edu.kit.ifbc.common.dto.VariableStateDTO;
import edu.kit.ifbc.common.ifbcmodel.confidentiality.ConfidentialityLattice;
import edu.kit.ifbc.common.ifbcmodel.integrity.IntegrityLattice;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import edu.kit.ifbc.common.ifbcmodel.statements.AbstractIFbCStatement;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import java.util.logging.Logger;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Serdeable
public class IFbCFormula {
    private final static Logger LOGGER = Logger.getGlobal();
    private String name;
    private AbstractIFbCStatement statement;
    private List<JavaVariable> javaVariables;
    private List<Renaming> renamings;

    private ConfidentialityLattice confidentialityLattice;
    private IntegrityLattice integrityLattice;

    private Integer level;

    private boolean checkConfidentiality = true;
    private boolean checkIntegrity = true;

    private boolean isConfidential;
    private boolean isIntegral;
    private VariableStateDTO preVariableState;
    private VariableStateDTO postVariableState;

    private IFbCContext context = null;

    public IFbCContext prove() {
        this.context = new IFbCContext();
        if (this.checkConfidentiality) {
        LOGGER.info("Checking confidentiality");
            context.setConfidentiality(this.proveConfidentiality());
        }
        if (this.checkIntegrity) {
        LOGGER.info("Checking integrity");
            context.setIntegrity(this.proveIntegrity());
        }
        return this.context;
    }

    private LatticeResultContext proveConfidentiality() {
        LOGGER.fine("lattice: \n" + confidentialityLattice.toString());
        LOGGER.fine("variableState: \t" + this.preVariableState.confidentiality() + "\t" + this.postVariableState);
        VariableState calculatedState;
        LatticeResultContext confidentialityContext = new LatticeResultContext(statement.getId());
        try {
            calculatedState = statement.calculatePostVariableState(
                confidentialityLattice, 
                confidentialityLattice.levelById(level),
                VariableState.fromIDs(this.preVariableState.confidentiality(), confidentialityLattice),
                confidentialityContext
            );
        } catch (VariableParsingException e) {
            LOGGER.severe(e.toString());
            return confidentialityContext;
        }

        LOGGER.fine(context.toString());
        confidentialityContext.setSuccessfull(calculatedState.equals(VariableState.fromIDs(this.postVariableState.confidentiality(), confidentialityLattice)));

        LOGGER.fine("calculated: \t" + calculatedState + "\n post: \t" + VariableState.fromIDs(this.postVariableState.confidentiality(), confidentialityLattice) + "\n equal: \t" + calculatedState.equals(VariableState.fromIDs(this.postVariableState.confidentiality(), confidentialityLattice)));
        return confidentialityContext;
    }

    private LatticeResultContext proveIntegrity() {
        LOGGER.info("lattice: \n" + integrityLattice.toString());
        LOGGER.info("variableState: \t" + this.preVariableState.integrity() + "\t" + this.postVariableState);
        VariableState calculatedState;
        LatticeResultContext integrityContext = new LatticeResultContext(statement.getId());
        try {
            calculatedState = statement.calculatePostVariableState(
                integrityLattice, 
                integrityLattice.levelById(level),
                VariableState.fromIDs(this.preVariableState.integrity(), integrityLattice),
                integrityContext
            );
        } catch (VariableParsingException e) {
            LOGGER.severe(e.toString());
            return integrityContext;
        }

        LOGGER.fine(context.toString());
        integrityContext.setSuccessfull(calculatedState.equals(VariableState.fromIDs(this.postVariableState.integrity(), integrityLattice)));

        LOGGER.fine("calculated: \t" + calculatedState + "\n post: \t" + VariableState.fromIDs(this.postVariableState.integrity(), integrityLattice) + "\n equal: \t" + calculatedState.equals(VariableState.fromIDs(this.postVariableState.integrity(), confidentialityLattice)));
        return integrityContext;
    }
}
