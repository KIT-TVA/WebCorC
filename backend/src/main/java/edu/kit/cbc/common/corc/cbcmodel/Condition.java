package edu.kit.cbc.common.corc.cbcmodel;

import java.util.List;
import lombok.Data;

@Data
public class Condition implements Representable {

  private String condition;
  private List<String> modifiables;
  private String codeRepresentation;

  @Override
  public String getCodeRepresentation() {
    return this.codeRepresentation;
  }

  @Override
  public void setCodeRepresentation(String codeRepresentation) {
    this.codeRepresentation = codeRepresentation;
  }
}
