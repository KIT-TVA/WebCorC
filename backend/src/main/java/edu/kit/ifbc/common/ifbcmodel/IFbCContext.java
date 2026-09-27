package edu.kit.ifbc.common.ifbcmodel;

import io.micronaut.serde.annotation.Serdeable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Serdeable
public class IFbCContext {
    private LatticeResultContext confidentiality;
    private LatticeResultContext integrity;
}
