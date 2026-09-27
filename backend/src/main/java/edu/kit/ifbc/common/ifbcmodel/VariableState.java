package edu.kit.ifbc.common.ifbcmodel;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.micronaut.serde.annotation.Serdeable;
import lombok.Data;

@Data
@Serdeable
public class VariableState {
    private HashMap<String, Lattice.Level> levels;

    public VariableState(HashMap<String, Lattice.Level> level) {
        this.levels = level;
    }

    public VariableState(VariableState other) {
        HashMap<String, Lattice.Level> map = new HashMap<>();
        for (var entry : other.levels.entrySet()) {
            map.put(entry.getKey(), entry.getValue().clone());
        }
        this.levels = map;
    }

    public VariableState without(String variable) {
        VariableState copy = new VariableState(this);
        copy.levels.remove(variable);
        return copy;
    }

    public VariableState with(String variable, Lattice.Level level) {
        VariableState copy = new VariableState(this);
        copy.levels.put(variable, level);
        return copy;
    }

    public Lattice.Level levelOf(String variable, Lattice.Level def) {
        Lattice.Level level = this.levels.get(variable);
        if (level == null) {
            return def;
        } else {
            return level;
        }
    }

    public Lattice.Level[] levelOf(Lattice.Level def, String... variables) {
        Lattice.Level[] levels = new Lattice.Level[variables.length];
        
        for (int i = 0; i < variables.length; i++) {
            levels[i] = this.levelOf(variables[i], def);
        }
        
        return levels;
    }

    public VariableState withEachLub(Lattice lattice, VariableState other) {
        HashMap<String, Lattice.Level> newMap = new HashMap<>();
        for (String variable : this.levels.keySet()) {
            Lattice.Level otherLevel = other.levelOf(variable, this.levels.get(variable));
            newMap.put(variable, lattice.leastUpperBound(this.levels.get(variable), otherLevel));
        }
        for (String variable : other.levels.keySet()) {
            if (this.levels.containsKey(variable)) {
                continue;
            }
            newMap.put(variable, other.levels.get(variable));
        }
        return new VariableState(newMap);
    }

    public Set<String> getVariableSet() {
        return this.levels.keySet();
    }

    public boolean isCompatibleWith(Lattice lattice, VariableState other) {
        if (!this.levels.keySet().equals(other.levels.keySet())) {
            return false;
        }

        for (String level : this.levels.keySet()) {
            Lattice.Level lub = lattice.leastUpperBound(this.levels.get(level), other.levels.get(level));
            if (!lub.equals(other.levels.get(level))) {
                return false;
            }
        }
        return true;
    }

    @JsonCreator
    public static VariableState fromIDs(
        @JsonProperty("confidentiality") Map<String, Integer> ids,
        Lattice lattice
    ) {
        HashMap<String, Lattice.Level> levels = new HashMap<>();
        for (var entry : ids.entrySet()) {
            levels.put(entry.getKey(), lattice.levelById(entry.getValue()));
        }
        return new VariableState(levels);
    }
}
