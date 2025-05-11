package edu.kit.cbc.common.corc.cbcmodel;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
public class JavaVariable {
  private String name;
  private JavaVariableKind kind;
  private String modifier;
  private String displayName;

  public boolean hasDisplayName() {
    return this.displayName != null && !this.displayName.isEmpty();
  }

  @Override
  public String toString() {
    return "JavaVariable{" +
      "name='" + name + '\'' +
      ", kind=" + kind +
      ", modifier='" + modifier + '\'' +
      ", displayName='" + displayName + '\'' +
      '}';
  }
}
