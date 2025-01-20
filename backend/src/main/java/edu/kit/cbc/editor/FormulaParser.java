package edu.kit.cbc.editor;

import java.io.IOException;

import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.URIConverter;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.xmi.impl.XMIResourceFactoryImpl;
import org.eclipse.emfcloud.jackson.annotations.EcoreTypeInfo;
import org.eclipse.emfcloud.jackson.module.EMFModule;
import org.eclipse.emfcloud.jackson.module.EMFModule.Feature;
import org.eclipse.emfcloud.jackson.utils.ValueReader;
import org.eclipse.emfcloud.jackson.utils.ValueWriter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.node.ObjectNode;

import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelPackage;
import de.tu_bs.cs.isf.cbc.cbcmodel.GlobalConditions;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariables;
import de.tu_bs.cs.isf.cbc.cbcmodel.Renaming;
import edu.kit.cbc.common.CbCFormulaContainer;
import jakarta.inject.Singleton;

@Singleton
public class FormulaParser {

    private static String JAVA_VARIABLES_NAME = "javaVariables";
    private static String GLOBAL_CONDITIONS_NAME = "globalConditions";
    private static String RENAMING_NAME = "renaming";

    //This is necessary to initialize and register the package so
    //emfjson-jackson can actually use the generated classes
    private CbcmodelPackage cbcmodelPackage = CbcmodelPackage.eINSTANCE;

    //Object Mapper responsible for json parsing and generation
    private ObjectMapper mapper;

    //EMF Resource responsible for XML parsing
    private Resource resource;

    FormulaParser() {
        setupJsonMapper();
        setupXMLParser();
    }

    private void setupJsonMapper() {
        this.mapper = new ObjectMapper();
        EMFModule module = new EMFModule();
        module.configure(Feature.OPTION_SERIALIZE_DEFAULT_VALUE, true);

        //use "type" field instead of the default "eClass" field for type information
        //and use only the class name instead of full uri of the class.
        //taken from https://github.com/eclipse-emfcloud/emfjson-jackson/wiki/Customization#type-field
        module.setTypeInfo(
            new EcoreTypeInfo(
                "type",
                new ValueReader<String, EClass>() {
                    @Override
                    public EClass readValue(String value, DeserializationContext context) {
                        return (EClass) cbcmodelPackage.getEClassifier(value);
                    }
                },
                new ValueWriter<EClass, String>() {
                    @Override
                    public String writeValue(EClass value, SerializerProvider context) {
                        return value.getName();
                    }
                }
            )
        );
        mapper.registerModule(module);
    }

    private void setupXMLParser() {
        ResourceSet resourceSet = new ResourceSetImpl();
        resourceSet.getResourceFactoryRegistry().getExtensionToFactoryMap().put(Resource.Factory.Registry.DEFAULT_EXTENSION, new XMIResourceFactoryImpl());
        resourceSet.getPackageRegistry().put(cbcmodelPackage.getNsURI(), cbcmodelPackage);
        resource = resourceSet.createResource(URI.createURI("*.cbcmodel"));
    }

    CbCFormulaContainer fromXMLStringToCbC(String xmlString) throws IOException {
        resource.unload();
        resource.load(new URIConverter.ReadableInputStream(xmlString), null);

        CbCFormula cbCFormula = null;
        JavaVariables javaVariables = null;
        GlobalConditions globalConditions = null;
        Renaming renaming = null;

        for (EObject e : resource.getContents()) {
            switch (e.eClass().getName()) {
                case "CbCFormula":
                    cbCFormula = (CbCFormula) e;
                    break;
                case "JavaVariables":
                    javaVariables = (JavaVariables) e;
                    break;
                case "GlobalConditions":
                    globalConditions = (GlobalConditions) e;
                    break;
                case "Renaming":
                    renaming = (Renaming) e;
                    break;
                default:
                    break;
            }
        }

        return new CbCFormulaContainer(cbCFormula, javaVariables, globalConditions, renaming);
    }

    CbCFormulaContainer fromJsonStringToCbC(String jsonString) throws JsonProcessingException {
        //TODO: consider setting parent fields of statements accordingly
        //TODO: consider checking pre and post conditions
        CbCFormula cbCFormula = fromJsonString(jsonString, CbCFormula.class);

        JavaVariables javaVariables = fromJsonFieldStringOptional(jsonString, JAVA_VARIABLES_NAME, JavaVariables.class);
        GlobalConditions globalConditions = fromJsonFieldStringOptional(jsonString, GLOBAL_CONDITIONS_NAME, GlobalConditions.class);
        Renaming renaming = fromJsonFieldStringOptional(jsonString, RENAMING_NAME, Renaming.class);

        return new CbCFormulaContainer(cbCFormula, javaVariables, globalConditions, renaming);
    }

    private <T> T fromJsonFieldStringOptional(String jsonString, String fieldName, Class<T> type) {
        try {
            String javaVariablesString = mapper.readTree(jsonString)
                .get(fieldName)
                .toString();

            return fromJsonString(javaVariablesString, type);
        } catch (JsonProcessingException | NullPointerException e) {
            return null;
        }
    }

    private <T> T fromJsonString(String jsonString, Class<T> type) throws JsonProcessingException {
        return mapper.readValue(jsonString, type);
    }

    String toJsonString(CbCFormulaContainer formula) throws JsonProcessingException {
        ObjectNode result = mapper.valueToTree(formula.cbCFormula());
        result.putPOJO(JAVA_VARIABLES_NAME, mapper.valueToTree(formula.javaVariables()));
        result.putPOJO(GLOBAL_CONDITIONS_NAME, mapper.valueToTree(formula.globalConditions()));
        result.putPOJO(RENAMING_NAME, mapper.valueToTree(formula.renaming()));

        return result.toString();
    }
}
