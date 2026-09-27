package edu.kit.ifbc.common.ifbcmodel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Set;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.micronaut.core.annotation.Introspected;
import io.micronaut.serde.annotation.Serdeable;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Introspected
@Serdeable
public class Lattice {

    @Getter
    private Level minimalLevel;
    @Getter
    private Level maximalLevel;
    
    @JsonProperty("levels")
    @Getter
    private List<Level> topologicalOrder;
    
    @JsonProperty("levelById")
    @Getter
    private HashMap<Integer, Integer> orderMap;

    public Lattice(List<Level> levels) {
        if (levels.stream().filter(l -> l.parentIDs().isEmpty()).count() != 1) {
            throw new LatticeException("Exactly one level may have no parents and be the maximal level");
        }

        // Create a mapping from id to index in the levels list
        this.orderMap = new HashMap<>();
        IntStream.range(0, levels.size())
            .forEach((i) -> this.orderMap.put(levels.get(i).id(), i));

        /* 
            Calculate the topological order of the lattice.
            Uses a DFS to identify roots and to determine the level in the topological sort.

            This algorithm is based on the classical topological sort found in:
            @article{cormen2001section,
                title={Section 22.4: topological sort},
                author={Cormen, Thomas H and Leiserson, Charles E and Rivest, Ronald L and Stein, Clifford},
                journal={Introduction to Algorithms (2nd ed.), MIT Press and McGraw-Hill},
                pages={549--552},
                year={2001}
            }
        */
        
        this.topologicalOrder = new LinkedList<>();
        boolean[] tempMarkings = new boolean[levels.size()];
        boolean[] permMarkings = new boolean[levels.size()];
        boolean[] isParent = new boolean[levels.size()];
        int leftMostNonPermanentMarking = 0;

        RecursiveConsumer<Integer> visitVertex = (visit, vertex) -> {
            if (permMarkings[vertex]) {
                return;
            }
            if (tempMarkings[vertex]) {
                throw new LatticeException("Given lattice is not a DAG!");
            }

            tempMarkings[vertex] = true;
            List<Integer> parentIds = levels.get(vertex).parentIDs();
            if (parentIds == null) {
                parentIds = new LinkedList<>();
            }
            for (Integer parent : parentIds) {
                int index = orderMap.get(parent);
                isParent[index] = true;
                visit.apply(visit, index);
            }
            permMarkings[vertex] = true;
            this.topologicalOrder.addFirst(levels.get(vertex));
        };

        while (leftMostNonPermanentMarking < levels.size()) {
            visitVertex.apply(visitVertex, leftMostNonPermanentMarking);
            do { leftMostNonPermanentMarking += 1; } 
            while (leftMostNonPermanentMarking < levels.size() && permMarkings[leftMostNonPermanentMarking]);
        }

        int roots = 0;
        for (int i = 0; i < levels.size(); ++i) {
            if (!isParent[i]) {
                roots += 1;
            }
        }

        if (roots != 1) {
            throw new LatticeException("Given lattice has no global minimum");
        }

        this.minimalLevel = this.topologicalOrder.getFirst();
        this.maximalLevel = this.topologicalOrder.getLast();

        orderMap.clear();
        IntStream.range(0, this.topologicalOrder.size())
            .forEach((i) -> this.orderMap.put(this.topologicalOrder.get(i).id(), i));
    }


    public Level leastUpperBound(Level lhs, Level rhs) {
        if (lhs.equals(rhs)) {
            return lhs; 
        }
        int lhsIndex = this.orderMap.get(lhs.id());
        int rhsIndex = this.orderMap.get(rhs.id());
        int idxSmaller = Math.min(lhsIndex, rhsIndex);
        int idxBigger = Math.max(lhsIndex, rhsIndex);

        if (idxBigger == this.topologicalOrder.size() - 1) {
            return this.maximalLevel;
        }

        Queue<Integer> queue = new LinkedList<>();
        queue.add(idxSmaller);
        Set<Integer> parentsSmaller = new HashSet<>();

        while(!queue.isEmpty()) {
            int index = queue.remove();
            parentsSmaller.add(index);
            queue.addAll(this.topologicalOrder.get(index).parentIDs().stream().map((c) -> this.orderMap.get(c)).toList());
        }
        queue.clear();

        queue.add(idxBigger);
        while(!queue.isEmpty()) {
            int index = queue.remove();
            if (parentsSmaller.contains(index)) {
                return this.topologicalOrder.get(index);
            }
            queue.addAll(this.topologicalOrder.get(index).parentIDs().stream().map((c) -> this.orderMap.get(c)).toList());
        }
        // This will never happen as maximalLevel will eventually be reached.
        return null;
    }

    public Level leastUpperBound(Level... levels) {
        Level lub = levels[0];
        Logger.getGlobal().info("lub: " + lub.name() + ", " + lub.id());
        for (int i = 1; i < levels.length; i++) {
            Logger.getGlobal().info("i: " + i + " prev lub: " + lub.name() + ", " + lub.id() + " level: " + levels[i].name() + ", " + levels[i].id());
            lub = leastUpperBound(lub, levels[i]);
            Logger.getGlobal().info("i: " + i + " lub: " + lub.name() + ", " + lub.id());
        }
        return lub;
    }

    public Level levelById(Integer id) {
        return this.topologicalOrder.get(this.orderMap.get(id));
    }

    @Override
    public String toString() {
        return this.topologicalOrder.stream().map(l -> l.toString()).collect(Collectors.joining(","));
    }

    interface RecursiveConsumer<T> {
        void apply(RecursiveConsumer<T> self, T t);
    }
    
    @Serdeable
    public record Level(
        int id,
        String name,
        List<Integer> parentIDs
    ) implements Cloneable {
        public Level(int id, String name) {
            this(id, name, new ArrayList<>());
        }

        @Override
        public Level clone() {
            try {
                return (Level) super.clone();
            } catch (CloneNotSupportedException e) {
                throw new RuntimeException(e);
            }
        }
    }

    public class LatticeException extends RuntimeException {
        public LatticeException(String message) {
            super(message);
        }
    }

}
