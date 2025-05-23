/**
 *
 */
package de.tu_bs.cs.isf.cbc.cbcmodel.impl;

import de.tu_bs.cs.isf.cbc.cbcmodel.*;
import org.eclipse.emf.common.util.EList;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EDataType;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.EPackage;
import org.eclipse.emf.ecore.impl.EFactoryImpl;
import org.eclipse.emf.ecore.plugin.EcorePlugin;

import java.util.Map;

/**
 * <!-- begin-user-doc -->
 * An implementation of the model <b>Factory</b>.
 * <!-- end-user-doc -->
 * @generated
 */
public class CbcmodelFactoryImpl extends EFactoryImpl implements CbcmodelFactory {
    /**
     * Creates an instance of the factory.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public CbcmodelFactoryImpl() {
        super();
    }

    /**
     * Creates the default factory implementation.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public static CbcmodelFactory init() {
        try {
            CbcmodelFactory theCbcmodelFactory = (CbcmodelFactory) EPackage.Registry.INSTANCE.getEFactory(CbcmodelPackage.eNS_URI);
            if (theCbcmodelFactory != null) {
                return theCbcmodelFactory;
            }
        } catch (Exception exception) {
            EcorePlugin.INSTANCE.log(exception);
        }
        return new CbcmodelFactoryImpl();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @deprecated
     * @generated
     */
    @Deprecated
    public static CbcmodelPackage getPackage() {
        return CbcmodelPackage.eINSTANCE;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public EObject create(EClass eClass) {
        switch (eClass.getClassifierID()) {
            case CbcmodelPackage.CB_CFORMULA:
                return createCbCFormula();
            case CbcmodelPackage.CONDITION:
                return createCondition();
            case CbcmodelPackage.ABSTRACT_STATEMENT:
                return createAbstractStatement();
            case CbcmodelPackage.SKIP_STATEMENT:
                return createSkipStatement();
            case CbcmodelPackage.COMPOSITION_STATEMENT:
                return createCompositionStatement();
            case CbcmodelPackage.SELECTION_STATEMENT:
                return createSelectionStatement();
            case CbcmodelPackage.METHOD_STATEMENT:
                return createMethodStatement();
            case CbcmodelPackage.VARIANT:
                return createVariant();
            case CbcmodelPackage.RETURN_STATEMENT:
                return createReturnStatement();
            case CbcmodelPackage.SMALL_REPETITION_STATEMENT:
                return createSmallRepetitionStatement();
            case CbcmodelPackage.JAVA_VARIABLES:
                return createJavaVariables();
            case CbcmodelPackage.JAVA_VARIABLE:
                return createJavaVariable();
            case CbcmodelPackage.GLOBAL_CONDITIONS:
                return createGlobalConditions();
            case CbcmodelPackage.RENAMING:
                return createRenaming();
            case CbcmodelPackage.RENAME:
                return createRename();
            case CbcmodelPackage.CB_CPROBLEM:
                return createCbCProblem();
            case CbcmodelPackage.STRENGTH_WEAK_STATEMENT:
                return createStrengthWeakStatement();
            case CbcmodelPackage.ORIGINAL_STATEMENT:
                return createOriginalStatement();
            case CbcmodelPackage.CONF_TO_VARS_MAP:
                return (EObject) createConfToVarsMap();
            case CbcmodelPackage.SECURITY:
                return createSecurity();
            case CbcmodelPackage.AT_TYPES_TO_VARS_MAP:
                return (EObject) createAtTypesToVarsMap();
            case CbcmodelPackage.AT_TYPE:
                return createAtType();
            default:
                throw new IllegalArgumentException("The class '" + eClass.getName() + "' is not a valid classifier");
        }
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Object createFromString(EDataType eDataType, String initialValue) {
        switch (eDataType.getClassifierID()) {
            case CbcmodelPackage.VARIABLE_KIND:
                return createVariableKindFromString(eDataType, initialValue);
            case CbcmodelPackage.COMPOSITION_TECHNIQUE:
                return createCompositionTechniqueFromString(eDataType, initialValue);
            default:
                throw new IllegalArgumentException("The datatype '" + eDataType.getName() + "' is not a valid classifier");
        }
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String convertToString(EDataType eDataType, Object instanceValue) {
        switch (eDataType.getClassifierID()) {
            case CbcmodelPackage.VARIABLE_KIND:
                return convertVariableKindToString(eDataType, instanceValue);
            case CbcmodelPackage.COMPOSITION_TECHNIQUE:
                return convertCompositionTechniqueToString(eDataType, instanceValue);
            default:
                throw new IllegalArgumentException("The datatype '" + eDataType.getName() + "' is not a valid classifier");
        }
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public CbCFormula createCbCFormula() {
        CbCFormulaImpl cbCFormula = new CbCFormulaImpl();
        return cbCFormula;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Condition createCondition() {
        ConditionImpl condition = new ConditionImpl();
        return condition;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public AbstractStatement createAbstractStatement() {
        AbstractStatementImpl abstractStatement = new AbstractStatementImpl();
        return abstractStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public SkipStatement createSkipStatement() {
        SkipStatementImpl skipStatement = new SkipStatementImpl();
        return skipStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public CompositionStatement createCompositionStatement() {
        CompositionStatementImpl compositionStatement = new CompositionStatementImpl();
        return compositionStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public SelectionStatement createSelectionStatement() {
        SelectionStatementImpl selectionStatement = new SelectionStatementImpl();
        return selectionStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public MethodStatement createMethodStatement() {
        MethodStatementImpl methodStatement = new MethodStatementImpl();
        return methodStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Variant createVariant() {
        VariantImpl variant = new VariantImpl();
        return variant;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public ReturnStatement createReturnStatement() {
        ReturnStatementImpl returnStatement = new ReturnStatementImpl();
        return returnStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public SmallRepetitionStatement createSmallRepetitionStatement() {
        SmallRepetitionStatementImpl smallRepetitionStatement = new SmallRepetitionStatementImpl();
        return smallRepetitionStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public JavaVariables createJavaVariables() {
        JavaVariablesImpl javaVariables = new JavaVariablesImpl();
        return javaVariables;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public JavaVariable createJavaVariable() {
        JavaVariableImpl javaVariable = new JavaVariableImpl();
        return javaVariable;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public GlobalConditions createGlobalConditions() {
        GlobalConditionsImpl globalConditions = new GlobalConditionsImpl();
        return globalConditions;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Renaming createRenaming() {
        RenamingImpl renaming = new RenamingImpl();
        return renaming;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Rename createRename() {
        RenameImpl rename = new RenameImpl();
        return rename;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public CbCProblem createCbCProblem() {
        CbCProblemImpl cbCProblem = new CbCProblemImpl();
        return cbCProblem;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public StrengthWeakStatement createStrengthWeakStatement() {
        StrengthWeakStatementImpl strengthWeakStatement = new StrengthWeakStatementImpl();
        return strengthWeakStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public OriginalStatement createOriginalStatement() {
        OriginalStatementImpl originalStatement = new OriginalStatementImpl();
        return originalStatement;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public Map.Entry<String, Security> createConfToVarsMap() {
        ConfToVarsMapImpl confToVarsMap = new ConfToVarsMapImpl();
        return confToVarsMap;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Security createSecurity() {
        SecurityImpl security = new SecurityImpl();
        return security;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public Map.Entry<String, EList<AtType>> createAtTypesToVarsMap() {
        AtTypesToVarsMapImpl atTypesToVarsMap = new AtTypesToVarsMapImpl();
        return atTypesToVarsMap;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public AtType createAtType() {
        AtTypeImpl atType = new AtTypeImpl();
        return atType;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public VariableKind createVariableKindFromString(EDataType eDataType, String initialValue) {
        VariableKind result = VariableKind.get(initialValue);
        if (result == null)
            throw new IllegalArgumentException("The value '" + initialValue + "' is not a valid enumerator of '" + eDataType.getName() + "'");
        return result;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public String convertVariableKindToString(EDataType eDataType, Object instanceValue) {
        return instanceValue == null ? null : instanceValue.toString();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public CompositionTechnique createCompositionTechniqueFromString(EDataType eDataType, String initialValue) {
        CompositionTechnique result = CompositionTechnique.get(initialValue);
        if (result == null)
            throw new IllegalArgumentException("The value '" + initialValue + "' is not a valid enumerator of '" + eDataType.getName() + "'");
        return result;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public String convertCompositionTechniqueToString(EDataType eDataType, Object instanceValue) {
        return instanceValue == null ? null : instanceValue.toString();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public CbcmodelPackage getCbcmodelPackage() {
        return (CbcmodelPackage) getEPackage();
    }

} //CbcmodelFactoryImpl
