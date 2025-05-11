package edu.kit.cbc.editor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import edu.kit.cbc.common.CbCFormulaContainer;
import jakarta.inject.Singleton;
import java.io.IOException;

@Singleton
public class FormulaParser {

    //Object Mapper responsible for json parsing and generation
    private ObjectMapper mapper;

    public FormulaParser() {
        setupJsonMapper();
    }

    private void setupJsonMapper() {
        this.mapper = new ObjectMapper();
        this.mapper.configure(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature(), true);
    }

    CbCFormulaContainer fromXMLStringToCbC(String xmlString) throws IOException {
        throw new UnsupportedOperationException();
    }

    public CbCFormulaContainer fromJsonStringToCbC(String jsonString) throws JsonProcessingException {
        return mapper.readValue(jsonString, CbCFormulaContainer.class);
    }

    String toJsonString(CbCFormulaContainer formula) throws JsonProcessingException {
        mapper.valueToTree(formula);

        return result.toString();
    }
}
