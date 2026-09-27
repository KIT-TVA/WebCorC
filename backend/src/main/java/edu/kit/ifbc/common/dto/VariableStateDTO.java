package edu.kit.ifbc.common.dto;

import java.util.HashMap;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record VariableStateDTO(
    HashMap<String, Integer> confidentiality,
    HashMap<String, Integer> integrity
) {}