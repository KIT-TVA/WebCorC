package edu.kit.ifbc.editor;

import edu.kit.cbc.projects.files.controller.FilesController;
import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.confidentiality.ConfidentialityLattice;
import edu.kit.ifbc.common.ifbcmodel.integrity.IntegrityLattice;
import edu.kit.ifbc.common.ifbcmodel.IFbCContext;
import edu.kit.ifbc.common.ifbcmodel.IFbCFormula;
import jakarta.inject.Singleton;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Optional;
import java.util.function.Function;
import java.util.logging.Logger;

import lombok.Getter;

@Singleton
public class VerificationJob extends Thread {

    private static final String LOGGER_FORMAT = "%s %s\n";

    @Getter private String log;
    @Getter private boolean finished = false;
    private HashSet<Function<String, Boolean>> listeners;

    @Getter private IFbCFormula formula;
    private Runnable onFinished;

    private static final Logger LOGGER = Logger.getGlobal();

    VerificationJob(Optional<String> projectId, IFbCFormula formula, FilesController filesController, Runnable onFinished) throws IOException {
        log = "";
        listeners = new HashSet<Function<String, Boolean>>();
        this.formula = formula;
        this.onFinished = onFinished;

        log("confidentiality check initialized");
    }

    public void run() {
        log("ifbc check started");
        IFbCContext context = formula.prove();
        finished = true;

        LatticeResultContext confidentialityResult = context.getConfidentiality();
        LatticeResultContext integrityResult = context.getIntegrity();

        if (formula.isCheckConfidentiality()) {
            ConfidentialityLattice confidentialityLattice = formula.getConfidentialityLattice();

            confidentialityResult.setPostStateCompatiblity(
                confidentialityLattice, 
                VariableState.fromIDs(formula.getPostVariableState().confidentiality(), confidentialityLattice)
            );
        }

        if (formula.isCheckIntegrity()) {
            IntegrityLattice integrityLattice = formula.getIntegrityLattice();
            integrityResult.setPostStateCompatiblity(
                integrityLattice, 
                VariableState.fromIDs(formula.getPostVariableState().integrity(), integrityLattice)
            );
        }

        if (confidentialityResult != null) {
            if (confidentialityResult.isSuccessfull()) {
                formula.setConfidential(true);
                log("all statements were successfully for confidentiality!");
            } else {
                formula.setConfidential(false);
                log("WebCorC was unable to check for confidentiality. See the log for further information...");
            }
        }

        if (integrityResult != null) {
            if (integrityResult.isSuccessfull()) {
                formula.setIntegral(true);
                log("all statements were successfully for integrity!");
            } else {
                formula.setIntegral(false);
                log("WebCorC was unable to check for integrity. See the log for further information...");
            }
        }
        log("ifbc check complete");

        //Keep job output and result available for some time before it is deleted
        try {
            Thread.sleep(Duration.ofMinutes(60));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        onFinished.run();
    }

    public void addListener(Function<String, Boolean> listener) {
        listeners.add(listener);
    }

    private void log(String message) {
        log += String.format(LOGGER_FORMAT, this.getCurrentTimestamp(), message);
        //Call all listeners. The listener returns true if it detects that its WebSocket connection was closed,
        //so it will be removed from the listener pool
        listeners.removeIf(l -> l.apply(message));
    }

    private String getCurrentTimestamp() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("'['HH:mm:ss']'");
        return LocalTime.now().format(formatter);
    }

}
