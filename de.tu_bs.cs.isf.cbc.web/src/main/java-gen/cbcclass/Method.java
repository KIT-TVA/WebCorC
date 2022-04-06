/**
 */
package cbcclass;

import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;

import org.eclipse.emf.ecore.EObject;

/**
 * <!-- begin-user-doc -->
 * A representation of the model object '<em><b>Method</b></em>'.
 * <!-- end-user-doc -->
 *
 * <p>
 * The following features are supported:
 * </p>
 * <ul>
 *   <li>{@link cbcclass.Method#getCbcDiagramURI <em>Cbc Diagram URI</em>}</li>
 *   <li>{@link cbcclass.Method#getSignature <em>Signature</em>}</li>
 *   <li>{@link cbcclass.Method#getAssignable <em>Assignable</em>}</li>
 *   <li>{@link cbcclass.Method#getPrecondition <em>Precondition</em>}</li>
 *   <li>{@link cbcclass.Method#getPostcondition <em>Postcondition</em>}</li>
 *   <li>{@link cbcclass.Method#getCbcStartTriple <em>Cbc Start Triple</em>}</li>
 * </ul>
 *
 * @see cbcclass.CbcclassPackage#getMethod()
 * @model
 * @generated
 */
public interface Method extends EObject {
	/**
	 * Returns the value of the '<em><b>Cbc Diagram URI</b></em>' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Cbc Diagram URI</em>' attribute.
	 * @see #setCbcDiagramURI(String)
	 * @see cbcclass.CbcclassPackage#getMethod_CbcDiagramURI()
	 * @model
	 * @generated
	 */
	String getCbcDiagramURI();

	/**
	 * Sets the value of the '{@link cbcclass.Method#getCbcDiagramURI <em>Cbc Diagram URI</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Cbc Diagram URI</em>' attribute.
	 * @see #getCbcDiagramURI()
	 * @generated
	 */
	void setCbcDiagramURI(String value);

	/**
	 * Returns the value of the '<em><b>Signature</b></em>' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Signature</em>' attribute.
	 * @see #setSignature(String)
	 * @see cbcclass.CbcclassPackage#getMethod_Signature()
	 * @model
	 * @generated
	 */
	String getSignature();

	/**
	 * Sets the value of the '{@link cbcclass.Method#getSignature <em>Signature</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Signature</em>' attribute.
	 * @see #getSignature()
	 * @generated
	 */
	void setSignature(String value);

	/**
	 * Returns the value of the '<em><b>Assignable</b></em>' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Assignable</em>' attribute.
	 * @see #setAssignable(String)
	 * @see cbcclass.CbcclassPackage#getMethod_Assignable()
	 * @model
	 * @generated
	 */
	String getAssignable();

	/**
	 * Sets the value of the '{@link cbcclass.Method#getAssignable <em>Assignable</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Assignable</em>' attribute.
	 * @see #getAssignable()
	 * @generated
	 */
	void setAssignable(String value);

	/**
	 * Returns the value of the '<em><b>Precondition</b></em>' containment reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Precondition</em>' containment reference.
	 * @see #setPrecondition(Condition)
	 * @see cbcclass.CbcclassPackage#getMethod_Precondition()
	 * @model containment="true"
	 * @generated
	 */
	Condition getPrecondition();

	/**
	 * Sets the value of the '{@link cbcclass.Method#getPrecondition <em>Precondition</em>}' containment reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Precondition</em>' containment reference.
	 * @see #getPrecondition()
	 * @generated
	 */
	void setPrecondition(Condition value);

	/**
	 * Returns the value of the '<em><b>Postcondition</b></em>' containment reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Postcondition</em>' containment reference.
	 * @see #setPostcondition(Condition)
	 * @see cbcclass.CbcclassPackage#getMethod_Postcondition()
	 * @model containment="true"
	 * @generated
	 */
	Condition getPostcondition();

	/**
	 * Sets the value of the '{@link cbcclass.Method#getPostcondition <em>Postcondition</em>}' containment reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Postcondition</em>' containment reference.
	 * @see #getPostcondition()
	 * @generated
	 */
	void setPostcondition(Condition value);

	/**
	 * Returns the value of the '<em><b>Cbc Start Triple</b></em>' reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Cbc Start Triple</em>' reference.
	 * @see #setCbcStartTriple(CbCFormula)
	 * @see cbcclass.CbcclassPackage#getMethod_CbcStartTriple()
	 * @model
	 * @generated
	 */
	CbCFormula getCbcStartTriple();

	/**
	 * Sets the value of the '{@link cbcclass.Method#getCbcStartTriple <em>Cbc Start Triple</em>}' reference.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Cbc Start Triple</em>' reference.
	 * @see #getCbcStartTriple()
	 * @generated
	 */
	void setCbcStartTriple(CbCFormula value);

} // Method
