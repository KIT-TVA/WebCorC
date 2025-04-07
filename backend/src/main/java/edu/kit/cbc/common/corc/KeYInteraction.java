package edu.kit.cbc.common.corc;

import de.uka.ilkd.key.control.KeYEnvironment;
import de.uka.ilkd.key.java.abstraction.KeYJavaType;
import de.uka.ilkd.key.logic.op.IObserverFunction;
import de.uka.ilkd.key.proof.Proof;
import de.uka.ilkd.key.proof.init.ProofInputException;
import de.uka.ilkd.key.proof.io.ProblemLoaderException;
import de.uka.ilkd.key.settings.ChoiceSettings;
import de.uka.ilkd.key.settings.ProofSettings;
import de.uka.ilkd.key.speclang.Contract;
import de.uka.ilkd.key.strategy.StrategyProperties;
import de.uka.ilkd.key.util.KeYTypeUtil;
import de.uka.ilkd.key.util.MiscTools;
import org.key_project.util.collection.ImmutableSet;

import java.io.File;
import java.io.IOException;
import java.util.*;

public class KeYInteraction {
    public Proof startKeyProof(File location, boolean inlining) {
        Proof proof = null;
        List<File> classPaths = null; // Optionally: Additional specifications
        // for API classes
        File bootClassPath = null; // Optionally: Different default
        // specifications for Java API
        List<File> includes = null; // Optionally: Additional includes to
        // consider
        try {
            // Ensure that Taclets are parsed
            if (!ProofSettings.isChoiceSettingInitialised()) {
                KeYEnvironment<?> env = KeYEnvironment.load(location, classPaths, bootClassPath, includes);
                env.dispose();
            }
            // Set Taclet options
            ChoiceSettings choiceSettings = ProofSettings.DEFAULT_SETTINGS.getChoiceSettings();
            Map<String, String> oldSettings = choiceSettings.getDefaultChoices();
            HashMap<String, String> newSettings = new HashMap<String, String>(oldSettings);
            newSettings.putAll(MiscTools.getDefaultTacletOptions());
            newSettings.put("runtimeExceptions", "runtimeExceptions:ban");
            choiceSettings.setDefaultChoices(newSettings);
            // Load source code
            KeYEnvironment<?> env = KeYEnvironment.load(location, classPaths, bootClassPath, includes);
            proof = env.getLoadedProof();
            // Set proof strategy options
            StrategyProperties sp = proof.getSettings().getStrategySettings().getActiveStrategyProperties();
            if (inlining)
                sp.setProperty(StrategyProperties.METHOD_OPTIONS_KEY, StrategyProperties.METHOD_EXPAND);
            else
                sp.setProperty(StrategyProperties.METHOD_OPTIONS_KEY, StrategyProperties.METHOD_CONTRACT);//METHOD_EXPAND
            sp.setProperty(StrategyProperties.LOOP_OPTIONS_KEY, StrategyProperties.LOOP_INVARIANT);
            sp.setProperty(StrategyProperties.DEP_OPTIONS_KEY, StrategyProperties.DEP_ON);
            sp.setProperty(StrategyProperties.QUERY_OPTIONS_KEY, StrategyProperties.QUERY_RESTRICTED);//
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
            System.out.println("  Start proof: " + location.getName());
            env.getUi().getProofControl().startAndWaitForAutoMode(proof);

            // Show proof result
            try {
                proof.saveToFile(location);

                //printStatistics(proof, inlining);
            } catch (IOException e) {
                e.printStackTrace();
            }

        } catch (ProblemLoaderException e) {
            System.out.println("  Exception at '" + e.getCause() + "'");
            e.printStackTrace();
        }
        return proof;
    }

    public Proof startKeYProofFirstContract(File location) {
        Proof proof = null;
        File keyFile = null;
        List<File> classPaths = null; // Optionally: Additional specifications
        // for API classes
        File bootClassPath = null; // Optionally: Different default
        // specifications for Java API
        List<File> includes = null; // Optionally: Additional includes to
        // consider
        try {
            // Ensure that Taclets are parsed
            if (!ProofSettings.isChoiceSettingInitialised()) {
                KeYEnvironment<?> env = KeYEnvironment.load(location, classPaths, bootClassPath, includes);
                env.dispose();
            }
            // Set Taclet options
            ChoiceSettings choiceSettings = ProofSettings.DEFAULT_SETTINGS.getChoiceSettings();
            Map<String, String> oldSettings = choiceSettings.getDefaultChoices();
            HashMap<String, String> newSettings = new HashMap<String, String>(oldSettings);
            newSettings.putAll(MiscTools.getDefaultTacletOptions());
            newSettings.put("runtimeExceptions", "runtimeExceptions:ban");
            choiceSettings.setDefaultChoices(newSettings);
            // Load source code
            KeYEnvironment<?> env = KeYEnvironment.load(location, classPaths, bootClassPath, includes);
            // proof = env.getLoadedProof();
            try {
                // List all specifications of all types in the source location
                // (not classPaths and bootClassPath)
                final List<Contract> proofContracts = new LinkedList<Contract>();
                Set<KeYJavaType> kjts = env.getJavaInfo().getAllKeYJavaTypes();
                for (KeYJavaType type : kjts) {
                    if (!KeYTypeUtil.isLibraryClass(type)) {
                        ImmutableSet<IObserverFunction> targets = env.getSpecificationRepository().getContractTargets(type);
                        for (IObserverFunction target : targets) {
                            ImmutableSet<Contract> contracts = env.getSpecificationRepository().getContracts(type, target);
                            for (Contract contract : contracts) {
                                proofContracts.add(contract);
                            }
                        }
                    }
                }
                // Perform proofs
                Contract contract = proofContracts.get(0);

                try {
                    // Create proof
                    proof = env.createProof(contract.createProofObl(env.getInitConfig(), contract));
                    // Set proof strategy options
                    StrategyProperties sp = proof.getSettings().getStrategySettings().getActiveStrategyProperties();
                    sp.setProperty(StrategyProperties.METHOD_OPTIONS_KEY, StrategyProperties.METHOD_EXPAND);
                    sp.setProperty(StrategyProperties.LOOP_OPTIONS_KEY, StrategyProperties.LOOP_INVARIANT);
                    sp.setProperty(StrategyProperties.DEP_OPTIONS_KEY, StrategyProperties.DEP_ON);
                    sp.setProperty(StrategyProperties.QUERY_OPTIONS_KEY, StrategyProperties.QUERY_RESTRICTED);// StrategyProperties.QUERY_ON
                    sp.setProperty(StrategyProperties.NON_LIN_ARITH_OPTIONS_KEY, StrategyProperties.NON_LIN_ARITH_DEF_OPS);
                    sp.setProperty(StrategyProperties.STOPMODE_OPTIONS_KEY, StrategyProperties.STOPMODE_DEFAULT);
                    proof.getSettings().getStrategySettings().setActiveStrategyProperties(sp);
                    // Make sure that the new options are used
                    int maxSteps = 5000;
                    ProofSettings.DEFAULT_SETTINGS.getStrategySettings().setMaxSteps(maxSteps);
                    ProofSettings.DEFAULT_SETTINGS.getStrategySettings().setActiveStrategyProperties(sp);
                    proof.getSettings().getStrategySettings().setMaxSteps(maxSteps);
                    proof.setActiveStrategy(proof.getServices().getProfile().getDefaultStrategyFactory().create(proof, sp));
                    // Start auto mode
//                      MainWindow.getInstance().setVisible(true);
                    env.getUi().getProofControl().startAndWaitForAutoMode(proof);
                    // Show proof result
                    //System.out.println("Proof is closed: " + proof.openGoals().isEmpty());
                    try {
                        String locationWithoutFileEnding = location.toString().substring(0, location.toString().indexOf("."));
                        keyFile = new File(locationWithoutFileEnding + ".proof");
                        proof.saveToFile(keyFile);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                } catch (ProofInputException e) {
                    System.out.println(
                            "Exception at '" + contract.getDisplayName() + "' of " + contract.getTarget() + ":");
                    e.printStackTrace();
                } finally {
                    if (proof != null) {
                        //proof.dispose(); // Ensure always that all instances
                        // of Proof are disposed
                    }
                }
            } finally {
                env.dispose(); // Ensure always that all instances of
                // KeYEnvironment are disposed
            }
        } catch (ProblemLoaderException e) {
            System.out.println("Exception at '" + e.getCause() + "'");
            e.printStackTrace();
        }
        return proof;
    }

    /*private static void printStatistics(Proof proof, boolean inlining) {
        Statistics s = proof.getStatistics();
        if(inlining)
            System.out.println("Inlining");
        else
            System.out.println("Contracting");
        System.out.println("Statistics: \n\t nodes: " + s.nodes + "\n\t rule apps: " + s.totalRuleApps
                + "\n\t time in Millis: " + s.timeInMillis );
    }*/

}
