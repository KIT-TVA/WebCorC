package edu.kit.cbc.Models;

public enum FileType {
    KEY("key"),
    PROVE("prove"),
    JAVA("java"),
    DIAGRAM("diagram");

    private final String type;

    FileType(String type) {
        this.type = type;
    }

    @Override
    public String toString() {
        return type;
    }
}
