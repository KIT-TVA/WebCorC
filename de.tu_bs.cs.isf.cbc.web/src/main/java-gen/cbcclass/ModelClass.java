/**
 */
package cbcclass;

import org.eclipse.emf.common.util.EList;

import org.eclipse.emf.ecore.EObject;

/**
 * <!-- begin-user-doc -->
 * A representation of the model object '<em><b>Model Class</b></em>'.
 * <!-- end-user-doc -->
 *
 * <p>
 * The following features are supported:
 * </p>
 * <ul>
 *   <li>{@link cbcclass.ModelClass#getName <em>Name</em>}</li>
 *   <li>{@link cbcclass.ModelClass#getJavaClassURI <em>Java Class URI</em>}</li>
 *   <li>{@link cbcclass.ModelClass#getFields <em>Fields</em>}</li>
 *   <li>{@link cbcclass.ModelClass#getClassInvariants <em>Class Invariants</em>}</li>
 *   <li>{@link cbcclass.ModelClass#getMethods <em>Methods</em>}</li>
 * </ul>
 *
 * @see cbcclass.CbcclassPackage#getModelClass()
 * @model
 * @generated
 */
public interface ModelClass extends EObject {
	/**
	 * Returns the value of the '<em><b>Name</b></em>' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Name</em>' attribute.
	 * @see #setName(String)
	 * @see cbcclass.CbcclassPackage#getModelClass_Name()
	 * @model
	 * @generated
	 */
	String getName();

	/**
	 * Sets the value of the '{@link cbcclass.ModelClass#getName <em>Name</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Name</em>' attribute.
	 * @see #getName()
	 * @generated
	 */
	void setName(String value);

	/**
	 * Returns the value of the '<em><b>Java Class URI</b></em>' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Java Class URI</em>' attribute.
	 * @see #setJavaClassURI(String)
	 * @see cbcclass.CbcclassPackage#getModelClass_JavaClassURI()
	 * @model
	 * @generated
	 */
	String getJavaClassURI();

	/**
	 * Sets the value of the '{@link cbcclass.ModelClass#getJavaClassURI <em>Java Class URI</em>}' attribute.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @param value the new value of the '<em>Java Class URI</em>' attribute.
	 * @see #getJavaClassURI()
	 * @generated
	 */
	void setJavaClassURI(String value);

	/**
	 * Returns the value of the '<em><b>Fields</b></em>' containment reference list.
	 * The list contents are of type {@link cbcclass.Field}.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Fields</em>' containment reference list.
	 * @see cbcclass.CbcclassPackage#getModelClass_Fields()
	 * @model containment="true"
	 * @generated
	 */
	EList<Field> getFields();

	/**
	 * Returns the value of the '<em><b>Class Invariants</b></em>' containment reference list.
	 * The list contents are of type {@link cbcclass.Condition}.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Class Invariants</em>' containment reference list.
	 * @see cbcclass.CbcclassPackage#getModelClass_ClassInvariants()
	 * @model containment="true"
	 * @generated
	 */
	EList<Condition> getClassInvariants();

	/**
	 * Returns the value of the '<em><b>Methods</b></em>' containment reference list.
	 * The list contents are of type {@link cbcclass.Method}.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @return the value of the '<em>Methods</em>' containment reference list.
	 * @see cbcclass.CbcclassPackage#getModelClass_Methods()
	 * @model containment="true"
	 * @generated
	 */
	EList<Method> getMethods();

} // ModelClass
