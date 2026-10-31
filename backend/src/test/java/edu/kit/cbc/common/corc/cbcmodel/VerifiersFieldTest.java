package edu.kit.cbc.common.corc.cbcmodel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * The per-statement sparse map of Verifier Conditions is named {@code verifiers} and widened
 * with an optional result (proven/status). The backend previously had no field for this at all,
 * so these tests build it from scratch rather than adapting an existing round trip. Mirrors
 * {@code openapi/schema/cbc/verifiers.yml}.
 */
class VerifiersFieldTest {

    private static final String STATEMENT_JSON = """
        {
          "name": "Statement1",
          "programStatement": "i = 1;",
          "type": "STATEMENT",
          "preCondition": {"condition": "i == 0"},
          "postCondition": {"condition": "i == 1"},
          "isProven": false,
          "verifiers": {
            "energy": {
              "preCondition": {"condition": "i == 0"},
              "postCondition": {"condition": "i == 1"},
              "proven": true,
              "status": "0.4 kWh"
            },
            "security": {
              "preCondition": {"condition": "true"},
              "postCondition": {"condition": "true"}
            }
          }
        }
        """;

    private static final String FORMULA_JSON = """
        {
          "name": "SimpleAssignment",
          "statement": %s,
          "javaVariables": [],
          "globalConditions": [],
          "renamings": [],
          "isProven": false,
          "verifiers": {
            "energy": {
              "preCondition": {"condition": "i == 0"},
              "postCondition": {"condition": "i == 1"}
            }
          }
        }
        """.formatted(STATEMENT_JSON);

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void deserializesVerifiersMapOnAStatement() throws Exception {
        Statement statement = (Statement) mapper.readValue(STATEMENT_JSON, AbstractStatement.class);

        Map<String, VerifierEntry> verifiers = statement.getVerifiers();
        assertEquals(2, verifiers.size());

        VerifierEntry energy = verifiers.get("energy");
        assertEquals("i == 0", energy.preCondition().getCondition());
        assertEquals("i == 1", energy.postCondition().getCondition());
        assertTrue(energy.proven());
        assertEquals("0.4 kWh", energy.status());

        VerifierEntry security = verifiers.get("security");
        assertNull(security.proven());
        assertNull(security.status());
    }

    @Test
    void serializesVerifiersUnderTheNewFieldNameAndOmitsAbsentResult() throws Exception {
        Statement statement = (Statement) mapper.readValue(STATEMENT_JSON, AbstractStatement.class);

        String written = mapper.writeValueAsString(statement);

        assertTrue(written.contains("\"verifiers\""), written);
        assertFalse(written.contains("verifierConditions"), written);
        // The "security" entry never had a result reported, so proven/status stay absent
        // (not written as null) on the wire.
        assertTrue(written.contains("\"security\":{\"preCondition\""), written);
    }

    @Test
    void deserializesAndSerializesVerifiersOnTheFormulaRoot() throws Exception {
        CbCFormula formula = mapper.readValue(FORMULA_JSON, CbCFormula.class);

        Map<String, VerifierEntry> verifiers = formula.getVerifiers();
        assertEquals(1, verifiers.size());
        assertEquals("i == 0", verifiers.get("energy").preCondition().getCondition());

        String written = mapper.writeValueAsString(formula);
        assertTrue(written.contains("\"verifiers\""), written);
        assertFalse(written.contains("verifierConditions"), written);
    }
}
