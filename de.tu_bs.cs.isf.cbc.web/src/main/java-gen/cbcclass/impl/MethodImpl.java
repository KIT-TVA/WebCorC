/**
 */
package cbcclass.impl;

import cbcclass.CbcclassPackage;
import cbcclass.Condition;
import cbcclass.Method;

import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;

import org.eclipse.emf.common.notify.Notification;
import org.eclipse.emf.common.notify.NotificationChain;

import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.InternalEObject;

import org.eclipse.emf.ecore.impl.ENotificationImpl;
import org.eclipse.emf.ecore.impl.MinimalEObjectImpl;

/**
 * <!-- begin-user-doc -->
 * An implementation of the model object '<em><b>Method</b></em>'.
 * <!-- end-user-doc -->
 * <p>
 * The following features are implemented:
 * </p>
 * <ul>
 *   <li>{@link cbcclass.impl.MethodImpl#getCbcDiagramURI <em>Cbc Diagram URI</em>}</li>
 *   <li>{@link cbcclass.impl.MethodImpl#getSignature <em>Signature</em>}</li>
 *   <li>{@link cbcclass.impl.MethodImpl#getAssignable <em>Assignable</em>}</li>
 *   <li>{@link cbcclass.impl.MethodImpl#getPrecondition <em>Precondition</em>}</li>
 *   <li>{@link cbcclass.impl.MethodImpl#getPostcondition <em>Postcondition</em>}</li>
 *   <li>{@link cbcclass.impl.MethodImpl#getCbcStartTriple <em>Cbc Start Triple</em>}</li>
 * </ul>
 *
 * @generated
 */
public class MethodImpl extends MinimalEObjectImpl.Container implements Method {
	/**
	 * The default value of the '{@link #getCbcDiagramURI() <em>Cbc Diagram URI</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getCbcDiagramURI()
	 * @generated
	 * @ordered
	 */
	protected static final String CBC_DIAGRAM_URI_EDEFAULT = null;

	/**
	 * The cached value of the '{@link #getCbcDiagramURI() <em>Cbc Diagram URI</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getCbcDiagramURI()
	 * @generated
	 * @ordered
	 */
	protected String cbcDiagramURI = CBC_DIAGRAM_URI_EDEFAULT;

	/**
	 * The default value of the '{@link #getSignature() <em>Signature</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getSignature()
	 * @generated
	 * @ordered
	 */
	protected static final String SIGNATURE_EDEFAULT = null;

	/**
	 * The cached value of the '{@link #getSignature() <em>Signature</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getSignature()
	 * @generated
	 * @ordered
	 */
	protected String signature = SIGNATURE_EDEFAULT;

	/**
	 * The default value of the '{@link #getAssignable() <em>Assignable</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getAssignable()
	 * @generated
	 * @ordered
	 */
	protected static final String ASSIGNABLE_EDEFAULT = null;

	/**
	 * The cached value of the '{@link #getAssignable() <em>Assignable</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getAssignable()
	 * @generated
	 * @ordered
	 */
	protected String assignable = ASSIGNABLE_EDEFAULT;

	/**
	 * The cached value of the '{@link #getPrecondition() <em>Precondition</em>}' containment reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getPrecondition()
	 * @generated
	 * @ordered
	 */
	protected Condition precondition;

	/**
	 * The cached value of the '{@link #getPostcondition() <em>Postcondition</em>}' containment reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getPostcondition()
	 * @generated
	 * @ordered
	 */
	protected Condition postcondition;

	/**
	 * The cached value of the '{@link #getCbcStartTriple() <em>Cbc Start Triple</em>}' reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see #getCbcStartTriple()
	 * @generated
	 * @ordered
	 */
	protected CbCFormula cbcStartTriple;

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	protected MethodImpl() {
		super();
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	protected EClass eStaticClass() {
		return CbcclassPackage.Literals.METHOD;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public String getCbcDiagramURI() {
		return cbcDiagramURI;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public void setCbcDiagramURI(String newCbcDiagramURI) {
		String oldCbcDiagramURI = cbcDiagramURI;
		cbcDiagramURI = newCbcDiagramURI;
		if (eNotificationRequired())
			eNotify(new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__CBC_DIAGRAM_URI, oldCbcDiagramURI, cbcDiagramURI));
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public String getSignature() {
		return signature;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public void setSignature(String newSignature) {
		String oldSignature = signature;
		signature = newSignature;
		if (eNotificationRequired())
			eNotify(new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__SIGNATURE, oldSignature, signature));
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public String getAssignable() {
		return assignable;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public void setAssignable(String newAssignable) {
		String oldAssignable = assignable;
		assignable = newAssignable;
		if (eNotificationRequired())
			eNotify(new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__ASSIGNABLE, oldAssignable, assignable));
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public Condition getPrecondition() {
		return precondition;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	public NotificationChain basicSetPrecondition(Condition newPrecondition, NotificationChain msgs) {
		Condition oldPrecondition = precondition;
		precondition = newPrecondition;
		if (eNotificationRequired()) {
			ENotificationImpl notification = new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__PRECONDITION, oldPrecondition, newPrecondition);
			if (msgs == null) msgs = notification; else msgs.add(notification);
		}
		return msgs;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public void setPrecondition(Condition newPrecondition) {
		if (newPrecondition != precondition) {
			NotificationChain msgs = null;
			if (precondition != null)
				msgs = ((InternalEObject)precondition).eInverseRemove(this, EOPPOSITE_FEATURE_BASE - CbcclassPackage.METHOD__PRECONDITION, null, msgs);
			if (newPrecondition != null)
				msgs = ((InternalEObject)newPrecondition).eInverseAdd(this, EOPPOSITE_FEATURE_BASE - CbcclassPackage.METHOD__PRECONDITION, null, msgs);
			msgs = basicSetPrecondition(newPrecondition, msgs);
			if (msgs != null) msgs.dispatch();
		}
		else if (eNotificationRequired())
			eNotify(new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__PRECONDITION, newPrecondition, newPrecondition));
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public Condition getPostcondition() {
		return postcondition;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	public NotificationChain basicSetPostcondition(Condition newPostcondition, NotificationChain msgs) {
		Condition oldPostcondition = postcondition;
		postcondition = newPostcondition;
		if (eNotificationRequired()) {
			ENotificationImpl notification = new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__POSTCONDITION, oldPostcondition, newPostcondition);
			if (msgs == null) msgs = notification; else msgs.add(notification);
		}
		return msgs;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public void setPostcondition(Condition newPostcondition) {
		if (newPostcondition != postcondition) {
			NotificationChain msgs = null;
			if (postcondition != null)
				msgs = ((InternalEObject)postcondition).eInverseRemove(this, EOPPOSITE_FEATURE_BASE - CbcclassPackage.METHOD__POSTCONDITION, null, msgs);
			if (newPostcondition != null)
				msgs = ((InternalEObject)newPostcondition).eInverseAdd(this, EOPPOSITE_FEATURE_BASE - CbcclassPackage.METHOD__POSTCONDITION, null, msgs);
			msgs = basicSetPostcondition(newPostcondition, msgs);
			if (msgs != null) msgs.dispatch();
		}
		else if (eNotificationRequired())
			eNotify(new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__POSTCONDITION, newPostcondition, newPostcondition));
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public CbCFormula getCbcStartTriple() {
		if (cbcStartTriple != null && cbcStartTriple.eIsProxy()) {
			InternalEObject oldCbcStartTriple = (InternalEObject)cbcStartTriple;
			cbcStartTriple = (CbCFormula)eResolveProxy(oldCbcStartTriple);
			if (cbcStartTriple != oldCbcStartTriple) {
				if (eNotificationRequired())
					eNotify(new ENotificationImpl(this, Notification.RESOLVE, CbcclassPackage.METHOD__CBC_START_TRIPLE, oldCbcStartTriple, cbcStartTriple));
			}
		}
		return cbcStartTriple;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	public CbCFormula basicGetCbcStartTriple() {
		return cbcStartTriple;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public void setCbcStartTriple(CbCFormula newCbcStartTriple) {
		CbCFormula oldCbcStartTriple = cbcStartTriple;
		cbcStartTriple = newCbcStartTriple;
		if (eNotificationRequired())
			eNotify(new ENotificationImpl(this, Notification.SET, CbcclassPackage.METHOD__CBC_START_TRIPLE, oldCbcStartTriple, cbcStartTriple));
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	@Override
	public NotificationChain eInverseRemove(InternalEObject otherEnd, int featureID, NotificationChain msgs) {
		switch (featureID) {
			case CbcclassPackage.METHOD__PRECONDITION:
				return basicSetPrecondition(null, msgs);
			case CbcclassPackage.METHOD__POSTCONDITION:
				return basicSetPostcondition(null, msgs);
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
			case CbcclassPackage.METHOD__CBC_DIAGRAM_URI:
				return getCbcDiagramURI();
			case CbcclassPackage.METHOD__SIGNATURE:
				return getSignature();
			case CbcclassPackage.METHOD__ASSIGNABLE:
				return getAssignable();
			case CbcclassPackage.METHOD__PRECONDITION:
				return getPrecondition();
			case CbcclassPackage.METHOD__POSTCONDITION:
				return getPostcondition();
			case CbcclassPackage.METHOD__CBC_START_TRIPLE:
				if (resolve) return getCbcStartTriple();
				return basicGetCbcStartTriple();
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
			case CbcclassPackage.METHOD__CBC_DIAGRAM_URI:
				setCbcDiagramURI((String)newValue);
				return;
			case CbcclassPackage.METHOD__SIGNATURE:
				setSignature((String)newValue);
				return;
			case CbcclassPackage.METHOD__ASSIGNABLE:
				setAssignable((String)newValue);
				return;
			case CbcclassPackage.METHOD__PRECONDITION:
				setPrecondition((Condition)newValue);
				return;
			case CbcclassPackage.METHOD__POSTCONDITION:
				setPostcondition((Condition)newValue);
				return;
			case CbcclassPackage.METHOD__CBC_START_TRIPLE:
				setCbcStartTriple((CbCFormula)newValue);
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
			case CbcclassPackage.METHOD__CBC_DIAGRAM_URI:
				setCbcDiagramURI(CBC_DIAGRAM_URI_EDEFAULT);
				return;
			case CbcclassPackage.METHOD__SIGNATURE:
				setSignature(SIGNATURE_EDEFAULT);
				return;
			case CbcclassPackage.METHOD__ASSIGNABLE:
				setAssignable(ASSIGNABLE_EDEFAULT);
				return;
			case CbcclassPackage.METHOD__PRECONDITION:
				setPrecondition((Condition)null);
				return;
			case CbcclassPackage.METHOD__POSTCONDITION:
				setPostcondition((Condition)null);
				return;
			case CbcclassPackage.METHOD__CBC_START_TRIPLE:
				setCbcStartTriple((CbCFormula)null);
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
			case CbcclassPackage.METHOD__CBC_DIAGRAM_URI:
				return CBC_DIAGRAM_URI_EDEFAULT == null ? cbcDiagramURI != null : !CBC_DIAGRAM_URI_EDEFAULT.equals(cbcDiagramURI);
			case CbcclassPackage.METHOD__SIGNATURE:
				return SIGNATURE_EDEFAULT == null ? signature != null : !SIGNATURE_EDEFAULT.equals(signature);
			case CbcclassPackage.METHOD__ASSIGNABLE:
				return ASSIGNABLE_EDEFAULT == null ? assignable != null : !ASSIGNABLE_EDEFAULT.equals(assignable);
			case CbcclassPackage.METHOD__PRECONDITION:
				return precondition != null;
			case CbcclassPackage.METHOD__POSTCONDITION:
				return postcondition != null;
			case CbcclassPackage.METHOD__CBC_START_TRIPLE:
				return cbcStartTriple != null;
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
		result.append(" (cbcDiagramURI: ");
		result.append(cbcDiagramURI);
		result.append(", signature: ");
		result.append(signature);
		result.append(", assignable: ");
		result.append(assignable);
		result.append(')');
		return result.toString();
	}

} //MethodImpl
