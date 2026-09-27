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
import java.util.logging.Level;
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
    private String name;
    private AbstractIFbCStatement statement;
    private List<JavaVariable> javaVariables;
    private List<Renaming> renamings;

    private ConfidentialityLattice confidentialityLattice = ConfidentialityLattice.defaultConfidentialityLattice();
    private IntegrityLattice integrityLattice = new IntegrityLattice();

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
        Logger.getGlobal().info("Checking confidentiality");
            context.setConfidentiality(this.proveConfidentiality());
        }
        if (this.checkIntegrity) {
        Logger.getGlobal().info("Checking integrity");
            context.setIntegrity(this.proveIntegrity());
        }
        return this.context;
    }

    private LatticeResultContext proveConfidentiality() {
        // Add this defensive check as somehow due to Jackson lattice is null if not provided in the request
        if (confidentialityLattice == null) {
            confidentialityLattice = ConfidentialityLattice.defaultConfidentialityLattice();
        }
        
        Logger.getGlobal().info("lattice: \n" + confidentialityLattice.toString());

        Logger.getGlobal().info("variableState: \t" + this.preVariableState.confidentiality() + "\t" + this.postVariableState);
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
            Logger.getGlobal().log(Level.SEVERE, e.toString());
            return confidentialityContext;
        }

        Logger.getGlobal().severe(context.toString());
        confidentialityContext.setSuccessfull(calculatedState.equals(VariableState.fromIDs(this.postVariableState.confidentiality(), confidentialityLattice)));

        Logger.getGlobal().info("calculated: \t" + calculatedState + "\n post: \t" + VariableState.fromIDs(this.postVariableState.confidentiality(), confidentialityLattice) + "\n equal: \t" + calculatedState.equals(VariableState.fromIDs(this.postVariableState.confidentiality(), confidentialityLattice)));
        return confidentialityContext;
    }

    private LatticeResultContext proveIntegrity() {
        // Add this defensive check as somehow due to Jackson lattice is null if not provided in the request
        if (integrityLattice == null) {
            integrityLattice = new IntegrityLattice();
        }
        
        Logger.getGlobal().info("lattice: \n" + integrityLattice.toString());

        Logger.getGlobal().info("variableState: \t" + this.preVariableState.integrity() + "\t" + this.postVariableState);
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
            Logger.getGlobal().log(Level.SEVERE, e.toString());
            return integrityContext;
        }

        Logger.getGlobal().severe(context.toString());
        integrityContext.setSuccessfull(calculatedState.equals(VariableState.fromIDs(this.postVariableState.integrity(), integrityLattice)));

        Logger.getGlobal().info("calculated: \t" + calculatedState + "\n post: \t" + VariableState.fromIDs(this.postVariableState.integrity(), integrityLattice) + "\n equal: \t" + calculatedState.equals(VariableState.fromIDs(this.postVariableState.integrity(), confidentialityLattice)));
        return integrityContext;
    }
}
