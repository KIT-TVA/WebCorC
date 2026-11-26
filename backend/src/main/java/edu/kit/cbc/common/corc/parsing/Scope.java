package edu.kit.cbc.common.corc.parsing;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * This class holds all variables and Class Methods that can get called on a certain parsing.
 */
public class Scope {
    private final Set<String> variables;
    private Map<String, List<String>> availableClassesAndMethods;

    public Scope() {
        this.variables = new HashSet<>();
        this.availableClassesAndMethods = new HashMap<>();
    }

    /**
     * Copy Constructor.
     * @param scope other Scope to copy
     */
    public Scope(Scope scope) {
        this.variables = new HashSet<>(scope.variables);
        this.availableClassesAndMethods = scope.availableClassesAndMethods.keySet().stream().collect(Collectors.toMap(
            Function.identity(),
            it -> new ArrayList<>(scope.availableClassesAndMethods.get(it))
        ));
    }

    public void addVariable(String variable) {
        this.variables.add(variable);
    }

    public void addAllVariables(Set<String> variables) {
        this.variables.addAll(variables);
    }

    public boolean containsVariable(String variable) {
        return this.variables.contains(variable);
    }

    public void addMethods(String className, List<String> methodNames) {
        List<String> currentMethods = new ArrayList<>();

        if (this.availableClassesAndMethods.containsKey(className)) {
            currentMethods = this.availableClassesAndMethods.get(className);
        }

        currentMethods.addAll(methodNames);
        this.availableClassesAndMethods.put(className, currentMethods);
    }

    public boolean containsClass(String className) {
        return this.availableClassesAndMethods.containsKey(className);
    }

    /**
     * All classes that are not equal to the specified classNames get removed.
     * @param classNames The names of classes that should stay
     */
    public void filterClasses(String... classNames) {
        Map<String, List<String>> oldClassesAndMethods = this.availableClassesAndMethods;
        this.availableClassesAndMethods = new HashMap<>();
        this.availableClassesAndMethods.putAll(oldClassesAndMethods);
        for (String className : classNames) {
            this.availableClassesAndMethods.put(
                className,
                oldClassesAndMethods.get(className)
            );
        }
    }

    public boolean containsMethod(String methodName) {
        return this.availableClassesAndMethods
            .values()
            .stream()
            .anyMatch(value -> value.contains(methodName));
    }

    public void merge(Scope otherScope) {
        this.variables.addAll(otherScope.variables);
        otherScope.availableClassesAndMethods.forEach(this::addMethods);
    }
}
