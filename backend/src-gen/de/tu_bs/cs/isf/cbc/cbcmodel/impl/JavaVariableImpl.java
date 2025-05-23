/**
 *
 */
package de.tu_bs.cs.isf.cbc.cbcmodel.impl;

import de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelPackage;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariable;
import de.tu_bs.cs.isf.cbc.cbcmodel.VariableKind;
import org.eclipse.emf.common.notify.Notification;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.impl.ENotificationImpl;
import org.eclipse.emf.ecore.impl.MinimalEObjectImpl;

/**
 * <!-- begin-user-doc -->
 * An implementation of the model object '<em><b>Java Variable</b></em>'.
 * <!-- end-user-doc -->
 * <p>
 * The following features are implemented:
 * </p>
 * <ul>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.JavaVariableImpl#getName <em>Name</em>}</li>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.JavaVariableImpl#getKind <em>Kind</em>}</li>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.JavaVariableImpl#getConfidentiality <em>Confidentiality</em>}</li>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.JavaVariableImpl#getModifier <em>Modifier</em>}</li>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.JavaVariableImpl#getDisplayedName <em>Displayed Name</em>}</li>
 * </ul>
 *
 * @generated
 */
public class JavaVariableImpl extends MinimalEObjectImpl.Container implements JavaVariable {
    /**
     * The default value of the '{@link #getName() <em>Name</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getName()
     * @generated
     * @ordered
     */
    protected static final String NAME_EDEFAULT = "int a";
    /**
     * The default value of the '{@link #getKind() <em>Kind</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getKind()
     * @generated
     * @ordered
     */
    protected static final VariableKind KIND_EDEFAULT = VariableKind.LOCAL;
    /**
     * The default value of the '{@link #getConfidentiality() <em>Confidentiality</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getConfidentiality()
     * @generated
     * @ordered
     */
    protected static final String CONFIDENTIALITY_EDEFAULT = null;
    /**
     * The default value of the '{@link #getModifier() <em>Modifier</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getModifier()
     * @generated
     * @ordered
     */
    protected static final String MODIFIER_EDEFAULT = null;
    /**
     * The default value of the '{@link #getDisplayedName() <em>Displayed Name</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getDisplayedName()
     * @generated
     * @ordered
     */
    protected static final String DISPLAYED_NAME_EDEFAULT = "kind + \" \" + name";
    /**
     * The cached value of the '{@link #getName() <em>Name</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getName()
     * @generated
     * @ordered
     */
    protected String name = NAME_EDEFAULT;
    /**
     * The cached value of the '{@link #getKind() <em>Kind</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getKind()
     * @generated
     * @ordered
     */
    protected VariableKind kind = KIND_EDEFAULT;
    /**
     * The cached value of the '{@link #getConfidentiality() <em>Confidentiality</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getConfidentiality()
     * @generated
     * @ordered
     */
    protected String confidentiality = CONFIDENTIALITY_EDEFAULT;
    /**
     * The cached value of the '{@link #getModifier() <em>Modifier</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getModifier()
     * @generated
     * @ordered
     */
    protected String modifier = MODIFIER_EDEFAULT;

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    protected JavaVariableImpl() {
        super();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    protected EClass eStaticClass() {
        return CbcmodelPackage.Literals.JAVA_VARIABLE;
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
    public void setName(String newName) {
        String oldName = name;
        name = newName;
        if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.JAVA_VARIABLE__NAME, oldName, name));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public VariableKind getKind() {
        return kind;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void setKind(VariableKind newKind) {
        VariableKind oldKind = kind;
        kind = newKind == null ? KIND_EDEFAULT : newKind;
        if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.JAVA_VARIABLE__KIND, oldKind, kind));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String getConfidentiality() {
        return confidentiality;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void setConfidentiality(String newConfidentiality) {
        String oldConfidentiality = confidentiality;
        confidentiality = newConfidentiality;
        if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.JAVA_VARIABLE__CONFIDENTIALITY, oldConfidentiality, confidentiality));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String getModifier() {
        return modifier;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void setModifier(String newModifier) {
        String oldModifier = modifier;
        modifier = newModifier;
        if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.JAVA_VARIABLE__MODIFIER, oldModifier, modifier));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String getDisplayedName() {
        return getKind() + " " + getName();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public boolean isSetDisplayedName() {
        // TODO: implement this method to return whether the 'Displayed Name' attribute is set
        // Ensure that you remove @generated or mark it @generated NOT
        throw new UnsupportedOperationException();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Object eGet(int featureID, boolean resolve, boolean coreType) {
        switch (featureID) {
            case CbcmodelPackage.JAVA_VARIABLE__NAME:
                return getName();
            case CbcmodelPackage.JAVA_VARIABLE__KIND:
                return getKind();
            case CbcmodelPackage.JAVA_VARIABLE__CONFIDENTIALITY:
                return getConfidentiality();
            case CbcmodelPackage.JAVA_VARIABLE__MODIFIER:
                return getModifier();
            case CbcmodelPackage.JAVA_VARIABLE__DISPLAYED_NAME:
                return getDisplayedName();
        }
        return super.eGet(featureID, resolve, coreType);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void eSet(int featureID, Object newValue) {
        switch (featureID) {
            case CbcmodelPackage.JAVA_VARIABLE__NAME:
                setName((String) newValue);
                return;
            case CbcmodelPackage.JAVA_VARIABLE__KIND:
                setKind((VariableKind) newValue);
                return;
            case CbcmodelPackage.JAVA_VARIABLE__CONFIDENTIALITY:
                setConfidentiality((String) newValue);
                return;
            case CbcmodelPackage.JAVA_VARIABLE__MODIFIER:
                setModifier((String) newValue);
                return;
        }
        super.eSet(featureID, newValue);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void eUnset(int featureID) {
        switch (featureID) {
            case CbcmodelPackage.JAVA_VARIABLE__NAME:
                setName(NAME_EDEFAULT);
                return;
            case CbcmodelPackage.JAVA_VARIABLE__KIND:
                setKind(KIND_EDEFAULT);
                return;
            case CbcmodelPackage.JAVA_VARIABLE__CONFIDENTIALITY:
                setConfidentiality(CONFIDENTIALITY_EDEFAULT);
                return;
            case CbcmodelPackage.JAVA_VARIABLE__MODIFIER:
                setModifier(MODIFIER_EDEFAULT);
                return;
        }
        super.eUnset(featureID);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public boolean eIsSet(int featureID) {
        switch (featureID) {
            case CbcmodelPackage.JAVA_VARIABLE__NAME:
                return NAME_EDEFAULT == null ? name != null : !NAME_EDEFAULT.equals(name);
            case CbcmodelPackage.JAVA_VARIABLE__KIND:
                return kind != KIND_EDEFAULT;
            case CbcmodelPackage.JAVA_VARIABLE__CONFIDENTIALITY:
                return CONFIDENTIALITY_EDEFAULT == null ? confidentiality != null : !CONFIDENTIALITY_EDEFAULT.equals(confidentiality);
            case CbcmodelPackage.JAVA_VARIABLE__MODIFIER:
                return MODIFIER_EDEFAULT == null ? modifier != null : !MODIFIER_EDEFAULT.equals(modifier);
            case CbcmodelPackage.JAVA_VARIABLE__DISPLAYED_NAME:
                return isSetDisplayedName();
        }
        return super.eIsSet(featureID);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String toString() {
        if (eIsProxy()) return super.toString();

        StringBuilder result = new StringBuilder(super.toString());
        result.append(" (name: ");
        result.append(name);
        result.append(", kind: ");
        result.append(kind);
        result.append(", confidentiality: ");
        result.append(confidentiality);
        result.append(", modifier: ");
        result.append(modifier);
        result.append(')');
        return result.toString();
    }

} //JavaVariableImpl
