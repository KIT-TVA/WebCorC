package edu.kit.cbc.common.corc;

import de.uka.ilkd.key.control.KeYEnvironment;
import de.uka.ilkd.key.proof.Proof;
import de.uka.ilkd.key.proof.io.ProblemLoaderException;
import de.uka.ilkd.key.settings.ChoiceSettings;
import de.uka.ilkd.key.settings.ProofSettings;
import de.uka.ilkd.key.strategy.StrategyProperties;
import de.uka.ilkd.key.util.MiscTools;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Information: This class is taken from <a href="https://github.com/KeYProject/key-java-example">here</a>.
 * We know that it is ugly but there is no documentation of how to interact with KeY other than this.
 * It is best if you leave this class unchanged. However, if you have to make changes here, make sure
 * to test them even more thoroughly than normal.
 */
public class KeYInteraction {

    private KeYInteraction() {
    }

    /**
     * Starts the KeY proof with a location and some info on inlining.
     */
    public static Proof startKeyProof(File location, boolean inlining) {
        try {

            if (!ProofSettings.isChoiceSettingInitialised()) {
                KeYEnvironment<?> env = KeYEnvironment.load(location);
                env.dispose();
            }

            /*Set TACLET options*/
            ChoiceSettings choiceSettings = ProofSettings.DEFAULT_SETTINGS.getChoiceSettings();
            Map<String, String> oldSettings = choiceSettings.getDefaultChoices();
            Map<String, String> newSettings = new HashMap<>(oldSettings);
            newSettings.putAll(MiscTools.getDefaultTacletOptions());
            newSettings.put("runtimeExceptions", "runtimeExceptions:ban");
            choiceSettings.setDefaultChoices(newSettings);

            KeYEnvironment<?> env = KeYEnvironment.load(location);
            Proof proof = env.getLoadedProof();

            /*Set STRATEGY options*/
            StrategyProperties sp = proof.getSettings().getStrategySettings().getActiveStrategyProperties();
            sp.setProperty(StrategyProperties.METHOD_OPTIONS_KEY,
                inlining ? StrategyProperties.METHOD_EXPAND : StrategyProperties.METHOD_CONTRACT);
            sp.setProperty(StrategyProperties.LOOP_OPTIONS_KEY, StrategyProperties.LOOP_INVARIANT);
            sp.setProperty(StrategyProperties.DEP_OPTIONS_KEY, StrategyProperties.DEP_ON);
            sp.setProperty(StrategyProperties.QUERY_OPTIONS_KEY, StrategyProperties.QUERY_RESTRICTED);
            sp.setProperty(StrategyProperties.NON_LIN_ARITH_OPTIONS_KEY, StrategyProperties.NON_LIN_ARITH_DEF_OPS);
            sp.setProperty(StrategyProperties.STOPMODE_OPTIONS_KEY, StrategyProperties.STOPMODE_NONCLOSE);
            proof.getSettings().getStrategySettings().setActiveStrategyProperties(sp);
            // Make sure that the new options are used
            int maxSteps = Integer.MAX_VALUE;
            ProofSettings.DEFAULT_SETTINGS.getStrategySettings().setMaxSteps(maxSteps);
            ProofSettings.DEFAULT_SETTINGS.getStrategySettings().setActiveStrategyProperties(sp);
            proof.getSettings().getStrategySettings().setMaxSteps(maxSteps);
            proof.setActiveStrategy(proof.getServices().getProfile().getDefaultStrategyFactory().create(proof, sp));
            // Start auto mode
            env.getUi().getProofControl().startAndWaitForAutoMode(proof);

            // Show proof result
            try {

                Path parentDir = location.getParentFile().toPath();
                Path proofLocation = parentDir.resolve(location.getName().split("\\.")[0] + ".proof");
                proof.saveToFile(proofLocation.toFile());
            } catch (IOException e) {
                e.printStackTrace();
            }

            return proof;

        } catch (ProblemLoaderException e) {
            e.printStackTrace();
        }
        return null;
    }

}
