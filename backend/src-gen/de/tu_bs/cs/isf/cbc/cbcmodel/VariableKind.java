/**
 *
 */
package de.tu_bs.cs.isf.cbc.cbcmodel;

import org.eclipse.emf.common.util.Enumerator;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * <!-- begin-user-doc -->
 * A representation of the literals of the enumeration '<em><b>Variable Kind</b></em>',
 * and utility methods for working with them.
 * <!-- end-user-doc -->
 * @see de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelPackage#getVariableKind()
 * @model
 * @generated
 */
public enum VariableKind implements Enumerator {
    /**
     * The '<em><b>LOCAL</b></em>' literal object.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #LOCAL_VALUE
     * @generated
     * @ordered
     */
    LOCAL(0, "LOCAL", "LOCAL"),

    /**
     * The '<em><b>PARAM</b></em>' literal object.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #PARAM_VALUE
     * @generated
     * @ordered
     */
    PARAM(1, "PARAM", "PARAM"),

    /**
     * The '<em><b>RETURN</b></em>' literal object.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #RETURN_VALUE
     * @generated
     * @ordered
     */
    RETURN(2, "RETURN", "RETURN"),

    /**
     * The '<em><b>GLOBAL</b></em>' literal object.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #GLOBAL_VALUE
     * @generated
     * @ordered
     */
    GLOBAL(3, "GLOBAL", "GLOBAL"),

    /**
     * The '<em><b>GLOBAL PARAM</b></em>' literal object.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #GLOBAL_PARAM_VALUE
     * @generated
     * @ordered
     */
    GLOBAL_PARAM(4, "GLOBAL_PARAM", "GLOBAL_PARAM"),

    /**
     * The '<em><b>RETURNPARAM</b></em>' literal object.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #RETURNPARAM_VALUE
     * @generated
     * @ordered
     */
    RETURNPARAM(5, "RETURNPARAM", "RETURNPARAM");

    /**
     * The '<em><b>LOCAL</b></em>' literal value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #LOCAL
     * @model
     * @generated
     * @ordered
     */
    public static final int LOCAL_VALUE = 0;

    /**
     * The '<em><b>PARAM</b></em>' literal value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #PARAM
     * @model
     * @generated
     * @ordered
     */
    public static final int PARAM_VALUE = 1;

    /**
     * The '<em><b>RETURN</b></em>' literal value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #RETURN
     * @model
     * @generated
     * @ordered
     */
    public static final int RETURN_VALUE = 2;

    /**
     * The '<em><b>GLOBAL</b></em>' literal value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #GLOBAL
     * @model
     * @generated
     * @ordered
     */
    public static final int GLOBAL_VALUE = 3;

    /**
     * The '<em><b>GLOBAL PARAM</b></em>' literal value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #GLOBAL_PARAM
     * @model
     * @generated
     * @ordered
     */
    public static final int GLOBAL_PARAM_VALUE = 4;

    /**
     * The '<em><b>RETURNPARAM</b></em>' literal value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #RETURNPARAM
     * @model
     * @generated
     * @ordered
     */
    public static final int RETURNPARAM_VALUE = 5;

    /**
     * An array of all the '<em><b>Variable Kind</b></em>' enumerators.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    private static final VariableKind[] VALUES_ARRAY =
            new VariableKind[]{
                    LOCAL,
                    PARAM,
                    RETURN,
                    GLOBAL,
                    GLOBAL_PARAM,
                    RETURNPARAM,
            };

    /**
     * A public read-only list of all the '<em><b>Variable Kind</b></em>' enumerators.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public static final List<VariableKind> VALUES = Collections.unmodifiableList(Arrays.asList(VALUES_ARRAY));
    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    private final int value;
    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    private final String name;
    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    private final String literal;

    /**
     * Only this class can construct instances.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    private VariableKind(int value, String name, String literal) {
        this.value = value;
        this.name = name;
        this.literal = literal;
    }

    /**
     * Returns the '<em><b>Variable Kind</b></em>' literal with the specified literal value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @param literal the literal.
     * @return the matching enumerator or <code>null</code>.
     * @generated
     */
    public static VariableKind get(String literal) {
        for (int i = 0; i < VALUES_ARRAY.length; ++i) {
            VariableKind result = VALUES_ARRAY[i];
            if (result.toString().equals(literal)) {
                return result;
            }
        }
        return null;
    }

    /**
     * Returns the '<em><b>Variable Kind</b></em>' literal with the specified name.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @param name the name.
     * @return the matching enumerator or <code>null</code>.
     * @generated
     */
    public static VariableKind getByName(String name) {
        for (int i = 0; i < VALUES_ARRAY.length; ++i) {
            VariableKind result = VALUES_ARRAY[i];
            if (result.getName().equals(name)) {
                return result;
            }
        }
        return null;
    }

    /**
     * Returns the '<em><b>Variable Kind</b></em>' literal with the specified integer value.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @param value the integer value.
     * @return the matching enumerator or <code>null</code>.
     * @generated
     */
    public static VariableKind get(int value) {
        switch (value) {
            case LOCAL_VALUE:
                return LOCAL;
            case PARAM_VALUE:
                return PARAM;
            case RETURN_VALUE:
                return RETURN;
            case GLOBAL_VALUE:
                return GLOBAL;
            case GLOBAL_PARAM_VALUE:
                return GLOBAL_PARAM;
            case RETURNPARAM_VALUE:
                return RETURNPARAM;
        }
        return null;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public int getValue() {
        return value;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String getLiteral() {
        return literal;
    }

    /**
     * Returns the literal value of the enumerator, which is its string representation.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String toString() {
        return literal;
    }

} //VariableKind
