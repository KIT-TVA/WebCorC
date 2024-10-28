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

import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelPackage;
import jakarta.inject.Singleton;

@Singleton
public class CbcFormulaParser {

    private ObjectMapper mapper;

    //This is necessary to initialize and register the package so
    //emfjson-jackson can actually use the generated classes
    private CbcmodelPackage cbcmodelPackage = CbcmodelPackage.eINSTANCE;

    CbcFormulaParser() {
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

    CbCFormula fromJsonString(String jsonString) throws JsonProcessingException {
        return mapper.readValue(jsonString, CbCFormula.class);
    }

    String toJsonString(CbCFormula formula) throws JsonProcessingException {
        return mapper.writeValueAsString(formula);
    }
}
