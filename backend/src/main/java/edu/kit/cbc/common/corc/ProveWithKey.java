package edu.kit.cbc.common.corc;

import de.uka.ilkd.key.proof.Goal;
import de.uka.ilkd.key.proof.Proof;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.stream.Collectors;

public class ProveWithKey {
    public static final String REGEX_ORIGINAL = "original";
    public static final String REGEX_RESULT = "\\\\result";

    AbstractStatement statement;
    private final List<JavaVariable> vars;
    private final List<Condition> conds;
    private final List<Renaming> renaming;
    private final String uri;
    private final IFileUtil fileHandler;

    public ProveWithKey(AbstractStatement statement, List<JavaVariable> vars, List<Condition> conds,
            List<Renaming> renaming, String uri, IFileUtil fileHandler) {
        super();
        this.statement = statement;
        this.vars = vars;
        this.conds = conds;
        this.renaming = renaming;
        this.uri = uri;
        this.fileHandler = fileHandler;
    }

    public static boolean proveJavaWithKey(File location) {
        KeYInteraction keyInt = new KeYInteraction();
        Proof proof = keyInt.startKeYProofFirstContract(location);
        if (proof != null) {
            // Show proof result
            boolean closed = proof.openGoals().isEmpty();
            System.out.println("Proof is closed: " + closed);
            proof.dispose();
            return closed;
        }
        System.out.println("Proof is null");
        return false;
    }

    public boolean proveStatementWithKey(boolean returnStatement, boolean inlining, int numberfile) {
        File location = createProveStatementWithKey(null, 0, true, "", "", inlining);
        System.out.println("  Verify Pre -> {Statement} Post");
        return proveWithKey(location, inlining);
    }

    public boolean proveStatementWithKey(boolean returnStatement, boolean inlining, String variants, int numberfile,
            String callingMethod, String varM) {
        if (variants == null || variants.isEmpty()) {
            File location = createProveStatementWithKey(null, 0, true, callingMethod, varM, inlining);
            System.out.println("  Verify Pre -> {Statement} Post");
            return proveWithKey(location, inlining);
        } else {
            boolean proven = true;

            List<String> refinements = new ArrayList<String>(Arrays.asList(variants.split(",")));
            File location = createProveStatementWithKey(refinements, numberfile, true, callingMethod, varM,
                    returnStatement);
            System.out.println("  Verify Pre -> {Statement} Post");

            if (!proveWithKey(location, inlining)) {
                proven = false;
            }
            return proven;
        }
    }

    public File createProveStatementWithKey(List<String> refinements, int numberFile,
            boolean override, String callingMethod, String varM, boolean returnStatement) {
        KeYFileContent content = new KeYFileContent();
        content.setLocation(fileHandler.getProjectLocation(uri));
        JavaVariable returnVariable = content.readVariables(vars);
        content.readGlobalConditions(conds);
        readPrePostModVars(refinements, returnVariable, callingMethod, content);
        content.rename(renaming);
        content.replaceThisWithSelf();

        if (returnStatement) { // TODO replace with correct handling of return
            content.setStatement(";");
        } else {
            content.setStatement(statement.getName());
        }

        String problem = content.getKeYStatementContent();

        problem = problem.replaceAll("static", "");
        problem = problem.replaceAll("return", ""); // TODO replace with correct handling of return

        String location = fileHandler.getLocationString(uri);
        File keyFile = fileHandler.writeFile(problem, location, numberFile, override);
        return keyFile;
    }

    public void readPrePostModVars(List<String> refinements, JavaVariable returnVariable, String callingMethod,
            KeYFileContent content) {
        String pre = Parser.getConditionFromCondition(statement.getPreCondition().getCondition());
        String post = Parser.getConditionFromCondition(statement.getPostCondition().getCondition());
        List<String> modifiables = Parser.getModifiedVarsFromCondition(statement.getPostCondition().getCondition());

        content.setPre(pre);
        content.setPost(post);
        List<String> unmodifiedVariables = Parser.getUnmodifiedVars(modifiables, vars);
        unmodifiedVariables = unmodifiedVariables.stream().distinct().collect(Collectors.toList());
        content.addUnmodifiableVars(unmodifiedVariables);

        if (pre == null || pre.length() == 0) {
            content.setPre("true");
        }
        if (post == null || post.length() == 0) {
            content.setPost("true");
        }
    }

    public boolean proveWithKey(File location, boolean inlining) {
        KeYInteraction keyInt = new KeYInteraction();
        Proof proof = keyInt.startKeyProof(location, inlining);
        if (proof != null) {
            // Show proof result
            boolean closed = proof.openGoals().isEmpty();
            System.out.println("Proof is closed: " + closed);
            return closed;
        }
        return false;
    }

    public boolean proveCImpliesCWithKey(Condition preCondition, Condition postCondition) {
        File location = createProveCImpliesCWithKey(preCondition.getCondition(), postCondition.getCondition(), 0, true);
        System.out.println("  Verify Pre -> Invariant");
        return proveWithKey(location, false);
    }

    public File createProveCImpliesCWithKey(String preCondition, String postCondition, int numberFile,
            boolean override) {
        KeYFileContent content = new KeYFileContent();
        content.setLocation(fileHandler.getProjectLocation(uri));
        content.readVariables(vars);
        content.readGlobalConditions(conds);

        content.setPreFromCondition(preCondition);
        content.setPostFromCondition(postCondition);
        content.rename(renaming);
        content.replaceThisWithSelf();

        String location = fileHandler.getLocationString(uri);
        File keyFile = fileHandler.writeFile(content.getKeYCImpliesCContent(), location, numberFile, override);
        return keyFile;
    }

    public boolean provePostRepetitionWithKey(Condition invariant, Condition guard, Condition postCondition) {
        String pre = invariant.getCondition() + " & !(" + guard.getCondition() + ")";
        File location = createProveCImpliesCWithKey(pre, postCondition.getCondition(), 0, true);
        System.out.println("  Verify (Invariant & !Guard) -> Post");
        return proveWithKey(location, false);
    }

    public boolean provePreSelWithKey(List<Condition> guards, Condition preCondition) {
        String guardString = "";
        if (guards != null && guards.get(0) != null) {
            guardString = "((" + guards.get(0).getCondition() + ")";
            for (int i = 1; i < guards.size(); i++) {
                guardString += " | (" + guards.get(i).getCondition() + ")";
            }
            guardString += ")";
        } else {
            guardString = "true";
        }
        File location = createProveCImpliesCWithKey(preCondition.getCondition(), guardString, 0, true);
        System.out.println("  Verify Pre -> GvGvG...");
        return proveWithKey(location, false);
    }

    public boolean proveVariantWithKey(String code, Condition invariant, Condition guard, Condition variant) {
        File location = createProveVariantWithKey(code, invariant, guard, variant, 0, true);
        System.out.println("Verify Pre -> {WhileStatement} (variant<variant0 & variant >= 0)");
        return proveWithKey(location, false);
    }

    public File createProveVariantWithKey(String code, Condition invariant, Condition guard, Condition variant,
            int numberFile, boolean override) {
        KeYFileContent content = new KeYFileContent();
        content.setLocation(fileHandler.getProjectLocation(uri));
        content.readVariables(vars);
        content.addVariable("int variant");
        content.readGlobalConditions(conds);
        content.setPreFromCondition(invariant.getCondition() + " & " + guard.getCondition());
        content.setVariantPost(variant.getCondition());
        content.setStatement(code);
        content.rename(renaming);
        content.replaceThisWithSelf();

        String location = fileHandler.getLocationString(uri);
        File keyFile = fileHandler.writeFile(content.getKeYStatementContent(), location, numberFile, override);
        return keyFile;
    }

    public String proveUseWeakestPreWithKey() {
        File location = createProveUseWeakestPreWithKey(0, true);
        System.out.println("Verify Pre -> {Statement} Post");
        return createWPWithKey(location);
    }

    private File createProveUseWeakestPreWithKey(int numberFile, boolean override) {
        KeYFileContent content = new KeYFileContent();
        content.setLocation(fileHandler.getProjectLocation(uri));
        content.readVariables(vars);
        content.readGlobalConditions(conds);
        content.setStatement(statement.getName());
        content.setPostFromCondition(statement.getPostCondition().getCondition());

        content.rename(renaming);

        String location = fileHandler.getLocationString(uri);
        File keyFile = fileHandler.writeFile(content.getKeYWPContent(), location, numberFile, override);
        return keyFile;
    }

    public String createWPWithKey(File location) {
        KeYInteraction keyInt = new KeYInteraction();
        Proof proof = keyInt.startKeyProof(location, false);
        if (proof != null) {
            String wp = "";
            Iterator<Goal> it = proof.openGoals().iterator();
            Goal goal = it.next();
            String[] goalString = goal.toString().split("==>");
            String antecedent = goalString[0].trim();
            String succedent = goalString[1].trim();
            wp += "(";
            if (antecedent.isEmpty()) {
                wp += succedent;
            } else {
                if (succedent.isEmpty()) {
                    wp += "!(" + antecedent + ")";
                } else {
                    wp += antecedent + " -> " + succedent;
                }
            }
            wp += ")";
            if (it.hasNext()) {
                goal = it.next();
                goalString = goal.toString().split("==>");
                antecedent = goalString[0].trim();
                succedent = goalString[1].trim();
                wp += " & (";
                if (antecedent.isEmpty()) {
                    wp += succedent;
                } else {
                    if (succedent.isEmpty()) {
                        wp += "!" + antecedent;
                    } else {
                        wp += antecedent + " -> " + succedent;
                    }
                }
                wp += ")";
            }
            System.out.println("  Weakest precondition is: " + wp);
            return wp;
        }
        return "";
    }
}
