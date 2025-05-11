package edu.kit.cbc.common.corc.cbcmodel;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class JavaVariables {
  private List<JavaVariable> variables;

  @Override
  public String toString() {
    return this.variables.toString();
  }
}
