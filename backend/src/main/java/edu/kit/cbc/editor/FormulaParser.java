package edu.kit.cbc.editor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import jakarta.inject.Singleton;
import java.io.IOException;

@Singleton
public class FormulaParser {

    // Object Mapper responsible for json parsing and generation
    private ObjectMapper mapper;

    public FormulaParser() {
        setupJsonMapper();
    }

    private void setupJsonMapper() {
        this.mapper = new ObjectMapper();
        this.mapper.configure(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature(), true);
    }

    CbCFormula fromXMLStringToCbC(String xmlString) throws IOException {
        throw new UnsupportedOperationException();
    }

    public CbCFormula fromJsonStringToCbC(String jsonString) throws JsonProcessingException {
        return mapper.readValue(jsonString, CbCFormula.class);
    }

    public String toJsonString(CbCFormula formula) throws JsonProcessingException {
        return this.mapper.writeValueAsString(formula);
    }
}
