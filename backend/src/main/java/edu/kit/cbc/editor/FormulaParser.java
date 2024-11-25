package edu.kit.cbc.editor;

import org.eclipse.emf.ecore.EClass;
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
import jakarta.inject.Singleton;

@Singleton
public class FormulaParser {

    private static String JAVA_VARIABLES_NAME = "javaVariables";
    private static String GLOBAL_CONDITIONS_NAME = "globalConditions";

    private ObjectMapper mapper;

    //This is necessary to initialize and register the package so
    //emfjson-jackson can actually use the generated classes
    private CbcmodelPackage cbcmodelPackage = CbcmodelPackage.eINSTANCE;

    FormulaParser() {
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

    CbCFormula fromJsonStringToCbC(String jsonString) throws JsonProcessingException {
        //TODO: consider setting parent fields of statements accordingly
        //TODO: consider checking pre and post conditions
        return fromJsonString(jsonString, CbCFormula.class);
    }

    JavaVariables fromJsonStringToJavaVariables(String jsonString) throws JsonProcessingException {
        String javaVariablesString = mapper.readTree(jsonString)
            .get(JAVA_VARIABLES_NAME)
            .toString();

        return fromJsonString(javaVariablesString, JavaVariables.class);
    }

    GlobalConditions fromJsonStringToGlobalConditions(String jsonString) throws JsonProcessingException {
        String globalConditionsString = mapper.readTree(jsonString)
            .get(GLOBAL_CONDITIONS_NAME)
            .toString();

        return fromJsonString(globalConditionsString, GlobalConditions.class);
    }

    <T> T fromJsonString(String jsonString, Class<T> type) throws JsonProcessingException {
        return mapper.readValue(jsonString, type);
    }

    String toJsonString(CbCFormula formula, JavaVariables javaVariables, GlobalConditions globalConditions) throws JsonProcessingException {
        ObjectNode result = (ObjectNode) mapper.valueToTree(formula);
        result.putPOJO(JAVA_VARIABLES_NAME, mapper.valueToTree(javaVariables));
        result.putPOJO(GLOBAL_CONDITIONS_NAME, mapper.valueToTree(globalConditions));

        return result.toString();
    }
}
