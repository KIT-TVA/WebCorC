package de.tu_bs.cs.isf.cbc.web.util;

import org.eclipse.emf.common.util.EList;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.resource.Resource;

import de.tu_bs.cs.isf.cbc.cbcmodel.AbstractStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.CompositionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.Condition;
import de.tu_bs.cs.isf.cbc.cbcmodel.GlobalConditions;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariables;
import de.tu_bs.cs.isf.cbc.cbcmodel.Renaming;
import de.tu_bs.cs.isf.cbc.cbcmodel.SelectionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.SmallRepetitionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.Variant;

public class VerifyAllStatements {
    
	public static void verify(Resource rResource, URI proofFileUri) {
    	JavaVariables vars = null;
		Renaming renaming = null;
		CbCFormula formula = null;
		GlobalConditions conds = null;
		
		for (EObject eObj : rResource.getContents()) {
			if (eObj instanceof JavaVariables) {
				vars = (JavaVariables) eObj;
			} else if (eObj instanceof Renaming) {
				renaming = (Renaming) eObj;
			} else if (eObj instanceof CbCFormula) {
				formula = (CbCFormula) eObj;
			} else if (eObj instanceof GlobalConditions) {
				conds = (GlobalConditions) eObj;
			}
		}
		
		AbstractStatement statement = formula.getStatement();
		boolean prove = false;
		prove = proveChildStatement(statement.getRefinement(), vars, conds, renaming, proofFileUri);	
		if (prove) {
			statement.setProven(true);
		} else {
			statement.setProven(false);
		}
		
		System.out.println("All statements verified");
    }
	
    private static boolean proveChildStatement(AbstractStatement statement, JavaVariables vars, GlobalConditions conds, Renaming renaming, URI uri) {
		boolean prove = false;
		 if (statement instanceof SmallRepetitionStatement) {
			prove = proveSmallReptitionStatement(statement, vars, conds, renaming, uri);
		} else if (statement instanceof CompositionStatement) {
			prove = proveCompositionStatement(statement, vars, conds, renaming, uri);
		} else if (statement instanceof SelectionStatement) {
			prove = proveSelectionStatement(statement, vars, conds, renaming, uri);
		} else if (statement instanceof AbstractStatement) {
			prove = proveAbstractStatement(statement, vars, conds, renaming, uri);
		}
		return prove;
	}

	public static boolean proveAbstractStatement(AbstractStatement statement, JavaVariables vars, GlobalConditions conds, 
			Renaming renaming, URI uri) {
		if (!statement.isProven()) {
			boolean prove = false;
			ProveWithKey prover = new ProveWithKey(statement, vars, conds, renaming, uri.toString(), null, new FileUtil(uri.toString()));
			prove = prover.proveStatementWithKey(false, false, 0);
			if (prove) {
				statement.setProven(true);
			} else {
				statement.setProven(false);
			}
	    	return prove;
		} else {
			System.out.println("Abstract statement: " + statement.getName() +" already true");
			return true;
		}
    }
    
    private static boolean proveCompositionStatement(AbstractStatement statement, JavaVariables vars, GlobalConditions conds, Renaming renaming, URI uri) {
    	boolean prove1, prove2 = false;
    	CompositionStatement compositionStatement = (CompositionStatement) statement;
    	if (compositionStatement.getFirstStatement().getRefinement() != null) {
    		prove1 = proveChildStatement(compositionStatement.getFirstStatement().getRefinement(), vars, conds, renaming, uri);
    	} else {
    		prove1 = proveChildStatement(compositionStatement.getFirstStatement(), vars, conds, renaming, uri);
    	}
    	if (compositionStatement.getSecondStatement().getRefinement() != null) {
    		prove2 = proveChildStatement(compositionStatement.getSecondStatement().getRefinement(), vars, conds, renaming, uri);
    	} else {
    		prove2 = proveChildStatement(compositionStatement.getSecondStatement(), vars, conds, renaming, uri);
    	}
    	if (prove1 && prove2 && true)  {
    		statement.setProven(true);
    	} else {
    		statement.setProven(false);//
    	}
		return (prove1 && prove2 && true);
    }
    
    private static boolean proveSelectionStatement(AbstractStatement statement, JavaVariables vars, GlobalConditions conds, Renaming renaming, URI uri) {
    	boolean proven = true;
    	SelectionStatement selectionStatement = (SelectionStatement) statement;
		for (AbstractStatement childStatement : selectionStatement.getCommands()) {
			proven = (proveChildStatement(childStatement.getRefinement(), vars, conds, renaming, uri) && proven && true);
		}
		boolean provePre = selectionStatement.isPreProve();
		if (!(selectionStatement.isProven() && provePre && true)) {
			if (!selectionStatement.isPreProve()) {
				EList<Condition> guards = selectionStatement.getGuards();
				Condition preCondition = selectionStatement.getParent().getPreCondition();
				ProveWithKey prove = new ProveWithKey(statement, vars, conds, renaming, uri.toString(), null, new FileUtil(uri.toString()));
				provePre = prove.provePreSelWithKey(guards, preCondition);
				selectionStatement.setPreProve(provePre);
			}
			if (provePre && proven && true) {
				selectionStatement.setProven(true);
			} else {
				selectionStatement.setProven(false);//
			}
			return (proven && provePre && true);
    	} else {
    		System.out.println("Selection statement already true");
    		return true;
    	}
    }
    
	
	private static boolean proveSmallReptitionStatement(AbstractStatement statement, JavaVariables vars, GlobalConditions conds, Renaming renaming, URI uri) {
		SmallRepetitionStatement repStatement = (SmallRepetitionStatement) statement;
		boolean proven = true;
		if (repStatement.getLoopStatement().getRefinement() != null) {
			proven = (proveChildStatement(repStatement.getLoopStatement().getRefinement(), vars, conds, renaming, uri) && proven && true);
		}
		boolean provePre = repStatement.isPreProven();
		boolean provePost = repStatement.isPostProven();
		boolean proveVar = repStatement.isVariantProven();
		if (!(repStatement.isProven() && provePre && provePost && proveVar && true)) {
			Condition invariant = repStatement.getInvariant();
			Condition preCondition = repStatement.getParent().getPreCondition();
			Condition guard = repStatement.getGuard();
			Condition postCondition = repStatement.getParent().getPostCondition();
			String code = ConstructCodeBlock.constructCodeBlockAndVerify(statement, true);
			Variant variant = repStatement.getVariant();
			ProveWithKey prove = new ProveWithKey(statement, vars, conds, renaming, uri.toString(), null, new FileUtil(uri.toString()));
			if (!provePre) {
				provePre = prove.proveCImpliesCWithKey(preCondition, invariant);
				repStatement.setPreProven(provePre);
			}
			if (!provePost) {
				provePost = prove.provePostRepetitionWithKey(invariant, guard, postCondition);
				repStatement.setPostProven(provePost);
			}
			if (!proveVar) {
				proveVar = prove.proveVariantWithKey(code, invariant, guard, variant);
				repStatement.setVariantProven(proveVar);	
			}
			if (proven && provePre && provePost && proveVar) {
				repStatement.setProven(true);
			} else {
				repStatement.setProven(false);//
			} 
	    	return (proven && provePre && provePost && proveVar);
		} else {
			repStatement.setPreProven(true);
			repStatement.setPostProven(true);
			repStatement.setVariantProven(true);
    		System.out.println("SRepetition statement already true");
			return true;
		}
	}
}
