package de.tu_bs.cs.isf.cbc.web.util;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Arrays;

import javax.servlet.http.HttpSession;

import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.emfjson.jackson.module.EMFModule;
import org.emfjson.jackson.resource.JsonResourceFactory;
import org.json.JSONArray;
import org.json.JSONObject;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import de.tu_bs.cs.isf.cbc.cbcmodel.AbstractStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelFactory;
import de.tu_bs.cs.isf.cbc.cbcmodel.CompositionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.CompositionTechnique;
import de.tu_bs.cs.isf.cbc.cbcmodel.Condition;
import de.tu_bs.cs.isf.cbc.cbcmodel.SelectionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.SmallRepetitionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.Variant;

public class JSONParser {

	public static String getContentString(JSONObject jObj) {
		String content = jObj.getString("content");
//		content = content.replaceAll("[\\n\\t ]", "");
		return content;
	}

	public static String stripString(String string) {
		string = string.replaceAll("[\\n\\t ]", "");
		return string;
	}

	public static String getPathString(JSONObject jObj, HttpSession session) {
		String pathString = jObj.getString("path");
		String[] pathParts = pathString.split("/");
		// do not care about the name
		pathParts = Arrays.copyOf(pathParts, pathParts.length - 1);
		pathString = String.join(File.separator, pathParts);
		pathString = pathString.replace("treeView", session.getId() + File.separator + "WebDirectory");
		System.out.println("path: " + pathString);
//		Path path = Path.of(SZ_LOCATION + File.separator + pathString);
		return pathString;
	}

	public static String getNameString(JSONObject jObj) {
		String pathString = jObj.getString("path");
		String[] pathParts = pathString.split("/");
		String fileName = pathParts[pathParts.length - 1];
		System.out.println("name: " + fileName);
//		Path path = Path.of(SZ_LOCATION + File.separator + pathString);
		return fileName;
	}

	/**
	 * Parses the JSON tree recursively and processes each CbC refinement that it
	 * finds along the tree to rebuild the encapsulated CbC-Model of the JSON.
	 * 
	 * @param jObjInput JSON representation of the model according to
	 *                  CbC-Ecore-Model.
	 */
	public static void parseFormulaTree(JSONObject jObjInput, Resource rResource, AbstractStatement parent) {
		// Iterate through JSON-object, attention: case-sensitive for now
		switch (jObjInput.getString("type")) {
		case "CBCFormula":
			// Assumption: first/root element in CorCInput/JSON-tree is a CbC-formula
			CbCFormula formula = createFormula(jObjInput);
			rResource.getContents().add(formula);
			// Starting recursive parsing steps into child nodes
			parseFormulaTree(jObjInput.getJSONObject("statement"), rResource, formula.getStatement());
			break;
		case "AbstractStatement":
			AbstractStatement absStatement = createStatement(jObjInput);
			parent.setRefinement(absStatement);
			UpdateConditionsOfChildren.updateRefinedStatement(parent, absStatement);
			break;
		case "selectionStatement":
			SelectionStatement selStatement = createSimpleSelection(jObjInput);
			parent.setRefinement(selStatement);
			UpdateConditionsOfChildren.updateRefinedStatement(parent, selStatement);
			// if a child was found, continue, else the recursive path ends here
			JSONArray jArrCommands = jObjInput.getJSONArray("statements");
			for (int i = 0; i < jArrCommands.length(); i++) { // attention: zero-based vs. one-based JSON
				parseFormulaTree(jArrCommands.getJSONObject(i), rResource, selStatement.getCommands().get(i));
			}
			break;
		case "compositionStatement":
			CompositionStatement compStatement = createComposition(jObjInput);
			parent.setRefinement(compStatement);
			UpdateConditionsOfChildren.updateRefinedStatement(parent, compStatement);
			parseFormulaTree(jObjInput.getJSONObject("statement1"), rResource, compStatement.getFirstStatement());
			parseFormulaTree(jObjInput.getJSONObject("statement2"), rResource, compStatement.getSecondStatement());
			break;
		case "repetitionStatement":
			SmallRepetitionStatement repStatement = createRepetition(jObjInput);
			parent.setRefinement(repStatement);
			UpdateConditionsOfChildren.updateRefinedStatement(parent, repStatement);
			parseFormulaTree(jObjInput.getJSONObject("loopStatement"), rResource, repStatement.getLoopStatement());
			break;
		case "strongWeakStatement":
			if (jObjInput.get("statements") instanceof JSONObject) {
				// Condition adjustments were made with the SW-statement, but it is not a leaf,
				// so just continuing parsing
				parseFormulaTree(jObjInput.getJSONObject("statements"), rResource, parent); // strwkStatement itself is
																							// the parent
			} else {
				AbstractStatement strwkStatement = createStatement(jObjInput);
				parent.setRefinement(strwkStatement);
				UpdateConditionsOfChildren.updateRefinedStatement(parent, strwkStatement);
			}
			break;
		}
	}

	/**
	 * Parses the JSON input once again to rill out the JSON response with boolean
	 * flags, which are extracted from the formula. JSON tree and refinement tree
	 * should have the same structure for this recursive method to work.
	 * 
	 * @param jObjInput JSON input
	 * @param formula   Evaluated formula
	 */
	public static void createJSONResponse(JSONObject jObjInput, AbstractStatement formula) {
		// Iterate through JSON-object and read/adjust the proven-booleans, attention:
		// case-sensitive for now
		switch (jObjInput.getString("type")) {
		case "CBCFormula":
			// Assumption: first/root element in CorCInput/JSON-tree is a CbC-formula
			jObjInput.put("proven", formula.isProven());
			// Starting recursive parsing steps into child nodes
			createJSONResponse(jObjInput.getJSONObject("statement"), formula.getRefinement());
			break;
		case "AbstractStatement":
			jObjInput.put("proven", formula.isProven());
			break;
		case "selectionStatement":
			jObjInput.put("proven", formula.isProven());
			// if a child was found, continue, else the recursive path ends here
			JSONArray jArrCommands = jObjInput.getJSONArray("statements");
			if (formula instanceof SelectionStatement) {
				jObjInput.put("preProven", ((SelectionStatement) formula).isPreProve());
				for (int i = 0; i < jArrCommands.length(); i++) { // attention: zero-based vs. one-based JSON
					createJSONResponse(jArrCommands.getJSONObject(i),
							((SelectionStatement) formula).getCommands().get(i).getRefinement());
				}
			}
			break;
		case "compositionStatement":
			jObjInput.put("proven", formula.isProven());
			if (formula instanceof CompositionStatement) {
				createJSONResponse(jObjInput.getJSONObject("statement1"),
						((CompositionStatement) formula).getFirstStatement().getRefinement());
				createJSONResponse(jObjInput.getJSONObject("statement2"),
						((CompositionStatement) formula).getSecondStatement().getRefinement());
			}
			break;
		case "repetitionStatement":
			jObjInput.put("proven", formula.isProven());
			if (formula instanceof SmallRepetitionStatement) {
				jObjInput.put("preProven", ((SmallRepetitionStatement) formula).isPreProven());
				jObjInput.put("postProven", ((SmallRepetitionStatement) formula).isPostProven());
				jObjInput.put("variantProven", ((SmallRepetitionStatement) formula).isVariantProven());
				createJSONResponse(jObjInput.getJSONObject("loopStatement"),
						((SmallRepetitionStatement) formula).getLoopStatement().getRefinement());
			}
			break;
		case "strongWeakStatement":
			if (jObjInput.get("statements") instanceof JSONObject) {
				// Condition adjustments were made with the SW-statement, but it is not a leaf,
				// so just continuing parsing and take child proof boolean
				jObjInput.put("proven", formula.isProven());
				createJSONResponse(jObjInput.getJSONObject("statements"), formula);
			} else {
				jObjInput.put("proven", formula.isProven());
			}
			break;
		}
	}

	private static CbCFormula createFormula(JSONObject jObjInput) {
		CbCFormula formula = CbcmodelFactory.eINSTANCE.createCbCFormula();
		formula.setName(jObjInput.getString("name"));
		// formula.setId(jObjInput.getString("id"));
		Condition preCondition = CbcmodelFactory.eINSTANCE.createCondition();
		preCondition.setName(jObjInput.getJSONObject("preCondition").getString("name"));
		formula.setPreCondition(preCondition);
		Condition postCondition = CbcmodelFactory.eINSTANCE.createCondition();
		postCondition.setName(jObjInput.getJSONObject("postCondition").getString("name"));
		formula.setPostCondition(postCondition);
		formula.setProven(Boolean.parseBoolean(jObjInput.getString("proven")));
		formula.setComment(jObjInput.getString("comment"));
		formula.setCompositionTechnique(CompositionTechnique.valueOf(jObjInput.getString("compositionTechnique")));
		formula.setClassName(jObjInput.getString("className"));
		formula.setMethodName(jObjInput.getString("methodName"));

		AbstractStatement statement = CbcmodelFactory.eINSTANCE.createAbstractStatement();
		statement.setName(jObjInput.getJSONObject("statement").getString("name"));
		formula.setStatement(statement);
		Condition preCondition2 = CbcmodelFactory.eINSTANCE.createCondition();
		preCondition2.setName(jObjInput.getJSONObject("statement").getJSONObject("preCondition").getString("name"));
		statement.setPreCondition(preCondition2);
		Condition postCondition2 = CbcmodelFactory.eINSTANCE.createCondition();
		postCondition2.setName(jObjInput.getJSONObject("statement").getJSONObject("postCondition").getString("name"));
		statement.setPostCondition(postCondition2);

		ResourceSet resourceSet = new ResourceSetImpl();
		resourceSet.getResourceFactoryRegistry().getExtensionToFactoryMap().put("json", new JsonResourceFactory());

		ObjectMapper mapperSerialize = EMFModule.setupDefaultMapper();
		String jsonFormula = "";
		JsonNode jsonNodeFormula = mapperSerialize.valueToTree(formula);
		try {
			jsonFormula = mapperSerialize.writeValueAsString(formula);
		} catch (JsonProcessingException e) {
			System.out.println(e.getMessage());
		}
		URI uri = URI.createURI(jsonFormula);
		Resource mapperDeserialize = resourceSet.createResource(URI.createURI(" http:///dummy.json"));

		InputStream stream = new ByteArrayInputStream(jsonFormula.getBytes(Charset.forName("UTF-8")));
		try {
			mapperDeserialize.load(stream, null);
		} catch (IOException e) {
			System.out.println(e.getMessage());
		}

		CbCFormula formula2 = CbcmodelFactory.eINSTANCE.createCbCFormula();
		formula2 = (CbCFormula) mapperDeserialize.getContents().get(0);

//
//		try {
//			String jsonString = mapper.writeValueAsString(formula);
//		} catch (JsonProcessingException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//
//		// testing area for emfjson-jackson
//
//		JsonNode data = mapper.valueToTree(formula);
//		
//		var resourceSet = new ResourceSetImpl();
//		var formula2 = CbcmodelFactory.eINSTANCE.createCbCFormula();
//		
//		ResourceSet rs = new ResourceSetImpl();
////		rs.
////
//		try {
//			Resource resource = mapper.reader().withAttribute(EMFContext.Attributes.RESOURCE_SET, rs)
//					.withAttribute(EMFContext.Attributes.RESOURCE_URI, "src/main/resources/data.json")
//					.forType(Resource.class).readValue(data);
//		} catch (IOException e1) {
//			// TODO Auto-generated catch block
//			e1.printStackTrace();
//		}
//
////		JsonNode data = mapper.valueToTree(formula);
//		Resource resource2 = new ResourceImpl();
////				resource.
//
//		try {
//			CbCFormula formula2 = mapper.reader().withAttribute(EMFContext.Attributes.RESOURCE, resource2)
//					.forType(CbCFormula.class).readValue(data);
//		} catch (IOException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}

		return formula;
	}

	private static CompositionStatement createComposition(JSONObject jObjInput) {
		CompositionStatement composition = CbcmodelFactory.eINSTANCE.createCompositionStatement();
		composition.setName(jObjInput.getString("name"));
		composition.setId(jObjInput.getString("id"));
		composition.setProven(Boolean.parseBoolean(jObjInput.getString("proven")));

		AbstractStatement statement1 = CbcmodelFactory.eINSTANCE.createAbstractStatement();
		statement1.setName(jObjInput.getJSONObject("statement1").getString("name"));
		composition.setFirstStatement(statement1);
		Condition pre1 = CbcmodelFactory.eINSTANCE.createCondition();
		pre1.setName(jObjInput.getJSONObject("statement1").getJSONObject("preCondition").getString("name"));
		statement1.setPreCondition(pre1);
		Condition post1 = CbcmodelFactory.eINSTANCE.createCondition();
		post1.setName(jObjInput.getJSONObject("statement1").getJSONObject("postCondition").getString("name"));
		statement1.setPostCondition(post1);
		statement1.setProven(Boolean.parseBoolean(jObjInput.getJSONObject("statement1").getString("proven")));
		statement1.setComment(jObjInput.getJSONObject("statement1").getString("comment"));

		Condition condition = CbcmodelFactory.eINSTANCE.createCondition();
		condition.setName(jObjInput.getJSONObject("intermediateCondition").getString("name"));
		composition.setIntermediateCondition(condition);
		AbstractStatement statement2 = CbcmodelFactory.eINSTANCE.createAbstractStatement();
		statement2.setName(jObjInput.getJSONObject("statement2").getString("name"));
		composition.setSecondStatement(statement2);
		Condition pre2 = CbcmodelFactory.eINSTANCE.createCondition();
		pre2.setName(jObjInput.getJSONObject("statement2").getJSONObject("preCondition").getString("name"));
		statement2.setPreCondition(pre2);
		Condition post2 = CbcmodelFactory.eINSTANCE.createCondition();
		post2.setName(jObjInput.getJSONObject("statement2").getJSONObject("postCondition").getString("name"));
		statement2.setPostCondition(post2);
		statement2.setProven(Boolean.parseBoolean(jObjInput.getJSONObject("statement2").getString("proven")));
		statement2.setComment(jObjInput.getJSONObject("statement2").getString("comment"));
		return composition;
	}

	private static SmallRepetitionStatement createRepetition(JSONObject jObjInput) {
		SmallRepetitionStatement repetitionStatement = CbcmodelFactory.eINSTANCE.createSmallRepetitionStatement();
		repetitionStatement.setName(jObjInput.getString("name"));
		repetitionStatement.setId(jObjInput.getString("id"));
		AbstractStatement statement = CbcmodelFactory.eINSTANCE.createAbstractStatement();
		statement.setName(jObjInput.getJSONObject("loopStatement").getString("name"));
		repetitionStatement.setLoopStatement(statement);
		Condition condition = CbcmodelFactory.eINSTANCE.createCondition();
		condition.setName(jObjInput.getJSONObject("guardCondition").getString("name"));
		repetitionStatement.setGuard(condition);
		Condition invariant = CbcmodelFactory.eINSTANCE.createCondition();
		invariant.setName(jObjInput.getJSONObject("invariantCondition").getString("name"));
		repetitionStatement.setInvariant(invariant);
		Variant variant = CbcmodelFactory.eINSTANCE.createVariant();
		variant.setName(jObjInput.getJSONObject("variant").getString("name"));
		repetitionStatement.setVariant(variant);

		Condition pre = CbcmodelFactory.eINSTANCE.createCondition();
		pre.setName(jObjInput.getJSONObject("loopStatement").getJSONObject("preCondition").getString("name"));
		statement.setPreCondition(pre);
		Condition post = CbcmodelFactory.eINSTANCE.createCondition();
		post.setName(jObjInput.getJSONObject("loopStatement").getJSONObject("postCondition").getString("name"));
		statement.setPostCondition(post);
		statement.setProven(Boolean.parseBoolean(jObjInput.getJSONObject("loopStatement").getString("proven")));
		statement.setComment(jObjInput.getJSONObject("loopStatement").getString("comment"));

		Condition preRep = CbcmodelFactory.eINSTANCE.createCondition();
		preRep.setName(jObjInput.getJSONObject("preCondition").getString("name"));
		repetitionStatement.setPreCondition(preRep);
		Condition postRep = CbcmodelFactory.eINSTANCE.createCondition();
		postRep.setName(jObjInput.getJSONObject("postCondition").getString("name"));
		repetitionStatement.setPostCondition(postRep);
		repetitionStatement.setPreProven(Boolean.parseBoolean(jObjInput.getString("preProven")));
		repetitionStatement.setPostProven(Boolean.parseBoolean(jObjInput.getString("postProven")));
		repetitionStatement.setVariantProven(Boolean.parseBoolean(jObjInput.getString("variantProven")));
		repetitionStatement.setProven(Boolean.parseBoolean(jObjInput.getString("proven")));
		return repetitionStatement;
	}

	private static SelectionStatement createSimpleSelection(JSONObject jObjInput) {
		SelectionStatement selectionStatement = CbcmodelFactory.eINSTANCE.createSelectionStatement();
		selectionStatement.setName(jObjInput.getString("name"));
		selectionStatement.setId(jObjInput.getString("id"));
		JSONArray jArrCommands = jObjInput.getJSONArray("statements");
		for (int i = 0; i < jArrCommands.length(); i++) {
			JSONObject jObjCurrent = jArrCommands.getJSONObject(i);
			AbstractStatement statement = CbcmodelFactory.eINSTANCE.createAbstractStatement();
			statement.setName(jObjCurrent.getString("name"));
			selectionStatement.getCommands().add(statement);
			Condition pre = CbcmodelFactory.eINSTANCE.createCondition();
			pre.setName(jObjCurrent.getJSONObject("preCondition").getString("name"));
			statement.setPreCondition(pre);
			Condition post = CbcmodelFactory.eINSTANCE.createCondition();
			post.setName(jObjCurrent.getJSONObject("postCondition").getString("name"));
			statement.setPostCondition(post);
			statement.setProven(Boolean.parseBoolean(jObjCurrent.getString("proven")));
			statement.setComment(jObjCurrent.getString("comment"));
		}

		JSONArray jArrGuards = jObjInput.getJSONArray("guards");
		for (int i = 0; i < jArrGuards.length(); i++) {
			Condition condition = CbcmodelFactory.eINSTANCE.createCondition();
			condition.setName(jArrGuards.getJSONObject(i).getString("name"));
			selectionStatement.getGuards().add(condition);
		}

		selectionStatement.setProven(Boolean.parseBoolean(jObjInput.getString("proven")));
		selectionStatement.setComment(jObjInput.getString("comment"));
		selectionStatement.setPreProve(Boolean.parseBoolean(jObjInput.getString("preProven")));
		return selectionStatement;
	}

	// identical for leaf strong-weak statements
	public static AbstractStatement createStatement(JSONObject jObjInput) {
		AbstractStatement statement = CbcmodelFactory.eINSTANCE.createAbstractStatement();
		statement.setId(jObjInput.getString("id"));
		if (jObjInput.getString("type").equals("strongWeakStatement")) {
			statement.setName(";");
		} else {
			statement.setName(jObjInput.getString("name"));
		}

		Condition preCondition = CbcmodelFactory.eINSTANCE.createCondition();
		preCondition.setName(jObjInput.getJSONObject("preCondition").getString("name"));
		statement.setPreCondition(preCondition);
		Condition postCondition = CbcmodelFactory.eINSTANCE.createCondition();
		postCondition.setName(jObjInput.getJSONObject("postCondition").getString("name"));
		statement.setPostCondition(postCondition);
		statement.setProven(Boolean.parseBoolean(jObjInput.getString("proven")));
		statement.setComment(jObjInput.getString("comment"));
		return statement;
	}
}
