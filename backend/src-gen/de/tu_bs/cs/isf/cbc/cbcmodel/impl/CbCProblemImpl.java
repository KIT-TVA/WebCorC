/**
 *
 */
package de.tu_bs.cs.isf.cbc.cbcmodel.impl;

import de.tu_bs.cs.isf.cbc.cbcmodel.*;
import org.eclipse.emf.common.notify.Notification;
import org.eclipse.emf.common.notify.NotificationChain;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.InternalEObject;
import org.eclipse.emf.ecore.impl.ENotificationImpl;
import org.eclipse.emf.ecore.impl.MinimalEObjectImpl;

/**
 * <!-- begin-user-doc -->
 * An implementation of the model object '<em><b>Cb CProblem</b></em>'.
 * <!-- end-user-doc -->
 * <p>
 * The following features are implemented:
 * </p>
 * <ul>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.CbCProblemImpl#getGlobalcondition <em>Globalcondition</em>}</li>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.CbCProblemImpl#getCbcformula <em>Cbcformula</em>}</li>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.CbCProblemImpl#getJavaVariable <em>Java Variable</em>}</li>
 *   <li>{@link de.tu_bs.cs.isf.cbc.cbcmodel.impl.CbCProblemImpl#getRenaming <em>Renaming</em>}</li>
 * </ul>
 *
 * @generated
 */
public class CbCProblemImpl extends MinimalEObjectImpl.Container implements CbCProblem {
    /**
     * The cached value of the '{@link #getGlobalcondition() <em>Globalcondition</em>}' containment reference.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getGlobalcondition()
     * @generated
     * @ordered
     */
    protected GlobalConditions globalcondition;

    /**
     * The cached value of the '{@link #getCbcformula() <em>Cbcformula</em>}' containment reference.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getCbcformula()
     * @generated
     * @ordered
     */
    protected CbCFormula cbcformula;

    /**
     * The cached value of the '{@link #getJavaVariable() <em>Java Variable</em>}' containment reference.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getJavaVariable()
     * @generated
     * @ordered
     */
    protected JavaVariables javaVariable;

    /**
     * The cached value of the '{@link #getRenaming() <em>Renaming</em>}' containment reference.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getRenaming()
     * @generated
     * @ordered
     */
    protected Renaming renaming;

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    protected CbCProblemImpl() {
        super();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    protected EClass eStaticClass() {
        return CbcmodelPackage.Literals.CB_CPROBLEM;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public GlobalConditions getGlobalcondition() {
        return globalcondition;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void setGlobalcondition(GlobalConditions newGlobalcondition) {
        if (newGlobalcondition != globalcondition) {
            NotificationChain msgs = null;
            if (globalcondition != null)
                msgs = ((InternalEObject) globalcondition).eInverseRemove(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION, null, msgs);
            if (newGlobalcondition != null)
                msgs = ((InternalEObject) newGlobalcondition).eInverseAdd(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION, null, msgs);
            msgs = basicSetGlobalcondition(newGlobalcondition, msgs);
            if (msgs != null) msgs.dispatch();
        } else if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION, newGlobalcondition, newGlobalcondition));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public NotificationChain basicSetGlobalcondition(GlobalConditions newGlobalcondition, NotificationChain msgs) {
        GlobalConditions oldGlobalcondition = globalcondition;
        globalcondition = newGlobalcondition;
        if (eNotificationRequired()) {
            ENotificationImpl notification = new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION, oldGlobalcondition, newGlobalcondition);
            if (msgs == null) msgs = notification;
            else msgs.add(notification);
        }
        return msgs;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public CbCFormula getCbcformula() {
        return cbcformula;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void setCbcformula(CbCFormula newCbcformula) {
        if (newCbcformula != cbcformula) {
            NotificationChain msgs = null;
            if (cbcformula != null)
                msgs = ((InternalEObject) cbcformula).eInverseRemove(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__CBCFORMULA, null, msgs);
            if (newCbcformula != null)
                msgs = ((InternalEObject) newCbcformula).eInverseAdd(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__CBCFORMULA, null, msgs);
            msgs = basicSetCbcformula(newCbcformula, msgs);
            if (msgs != null) msgs.dispatch();
        } else if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__CBCFORMULA, newCbcformula, newCbcformula));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public NotificationChain basicSetCbcformula(CbCFormula newCbcformula, NotificationChain msgs) {
        CbCFormula oldCbcformula = cbcformula;
        cbcformula = newCbcformula;
        if (eNotificationRequired()) {
            ENotificationImpl notification = new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__CBCFORMULA, oldCbcformula, newCbcformula);
            if (msgs == null) msgs = notification;
            else msgs.add(notification);
        }
        return msgs;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public JavaVariables getJavaVariable() {
        return javaVariable;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void setJavaVariable(JavaVariables newJavaVariable) {
        if (newJavaVariable != javaVariable) {
            NotificationChain msgs = null;
            if (javaVariable != null)
                msgs = ((InternalEObject) javaVariable).eInverseRemove(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE, null, msgs);
            if (newJavaVariable != null)
                msgs = ((InternalEObject) newJavaVariable).eInverseAdd(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE, null, msgs);
            msgs = basicSetJavaVariable(newJavaVariable, msgs);
            if (msgs != null) msgs.dispatch();
        } else if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE, newJavaVariable, newJavaVariable));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public NotificationChain basicSetJavaVariable(JavaVariables newJavaVariable, NotificationChain msgs) {
        JavaVariables oldJavaVariable = javaVariable;
        javaVariable = newJavaVariable;
        if (eNotificationRequired()) {
            ENotificationImpl notification = new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE, oldJavaVariable, newJavaVariable);
            if (msgs == null) msgs = notification;
            else msgs.add(notification);
        }
        return msgs;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Renaming getRenaming() {
        return renaming;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void setRenaming(Renaming newRenaming) {
        if (newRenaming != renaming) {
            NotificationChain msgs = null;
            if (renaming != null)
                msgs = ((InternalEObject) renaming).eInverseRemove(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__RENAMING, null, msgs);
            if (newRenaming != null)
                msgs = ((InternalEObject) newRenaming).eInverseAdd(this, EOPPOSITE_FEATURE_BASE - CbcmodelPackage.CB_CPROBLEM__RENAMING, null, msgs);
            msgs = basicSetRenaming(newRenaming, msgs);
            if (msgs != null) msgs.dispatch();
        } else if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__RENAMING, newRenaming, newRenaming));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public NotificationChain basicSetRenaming(Renaming newRenaming, NotificationChain msgs) {
        Renaming oldRenaming = renaming;
        renaming = newRenaming;
        if (eNotificationRequired()) {
            ENotificationImpl notification = new ENotificationImpl(this, Notification.SET, CbcmodelPackage.CB_CPROBLEM__RENAMING, oldRenaming, newRenaming);
            if (msgs == null) msgs = notification;
            else msgs.add(notification);
        }
        return msgs;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public NotificationChain eInverseRemove(InternalEObject otherEnd, int featureID, NotificationChain msgs) {
        switch (featureID) {
            case CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION:
                return basicSetGlobalcondition(null, msgs);
            case CbcmodelPackage.CB_CPROBLEM__CBCFORMULA:
                return basicSetCbcformula(null, msgs);
            case CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE:
                return basicSetJavaVariable(null, msgs);
            case CbcmodelPackage.CB_CPROBLEM__RENAMING:
                return basicSetRenaming(null, msgs);
        }
        return super.eInverseRemove(otherEnd, featureID, msgs);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Object eGet(int featureID, boolean resolve, boolean coreType) {
        switch (featureID) {
            case CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION:
                return getGlobalcondition();
            case CbcmodelPackage.CB_CPROBLEM__CBCFORMULA:
                return getCbcformula();
            case CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE:
                return getJavaVariable();
            case CbcmodelPackage.CB_CPROBLEM__RENAMING:
                return getRenaming();
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
            case CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION:
                setGlobalcondition((GlobalConditions) newValue);
                return;
            case CbcmodelPackage.CB_CPROBLEM__CBCFORMULA:
                setCbcformula((CbCFormula) newValue);
                return;
            case CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE:
                setJavaVariable((JavaVariables) newValue);
                return;
            case CbcmodelPackage.CB_CPROBLEM__RENAMING:
                setRenaming((Renaming) newValue);
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
            case CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION:
                setGlobalcondition((GlobalConditions) null);
                return;
            case CbcmodelPackage.CB_CPROBLEM__CBCFORMULA:
                setCbcformula((CbCFormula) null);
                return;
            case CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE:
                setJavaVariable((JavaVariables) null);
                return;
            case CbcmodelPackage.CB_CPROBLEM__RENAMING:
                setRenaming((Renaming) null);
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
            case CbcmodelPackage.CB_CPROBLEM__GLOBALCONDITION:
                return globalcondition != null;
            case CbcmodelPackage.CB_CPROBLEM__CBCFORMULA:
                return cbcformula != null;
            case CbcmodelPackage.CB_CPROBLEM__JAVA_VARIABLE:
                return javaVariable != null;
            case CbcmodelPackage.CB_CPROBLEM__RENAMING:
                return renaming != null;
        }
        return super.eIsSet(featureID);
    }

} //CbCProblemImpl
