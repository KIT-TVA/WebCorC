package edu.kit.cbc.common;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.GlobalConditions;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariables;
import de.tu_bs.cs.isf.cbc.cbcmodel.Renaming;

//Extra record to hold a CbCFormula, JavaVariables, and GlobalConditions instance all in one object
public record CbCFormulaContainer(CbCFormula cbCFormula, JavaVariables javaVariables, GlobalConditions globalConditions, Renaming renaming) { }
