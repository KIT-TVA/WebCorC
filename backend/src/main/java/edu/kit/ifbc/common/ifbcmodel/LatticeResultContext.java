package edu.kit.ifbc.common.ifbcmodel;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Stack;
import java.util.logging.Logger;

import com.fasterxml.jackson.annotation.JsonIgnore;

import io.micronaut.serde.annotation.Serdeable;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Serdeable
public class LatticeResultContext {
    private Map<String, IFbCStatementInfo> data = new HashMap<>();
    @Setter
    @Getter
    private boolean successfull = false;

    @JsonIgnore
    Stack<String> idStack = new Stack<>();

    public LatticeResultContext(String first) {
        this.data.put(first, new IFbCStatementInfo());
        this.idStack.push(first);
    }

    public void handleChild(String id) {
        this.idStack.push(id);
        this.data.put(id, new IFbCStatementInfo());
        Logger.getGlobal().severe("log: " + id + " \t " + this.data.keySet().toString());
    }

    public void setInfo(
        VariableState postVariableState,
        Lattice.Level contextLevel
    ) {
        IFbCStatementInfo info = this.data.get(this.idStack.peek());
        info.postVariableState = postVariableState;
        info.contextLevel = contextLevel;
        this.data.put(this.idStack.peek(), info);
    }

    public void finishChild() {
        String child = this.idStack.pop();
        Logger.getGlobal().info("log: " + child + " \t " + this.data.keySet().toString());
        if (this.idStack.size() > 0) {
            this.data.get(this.idStack.peek()).children.add(this.data.get(child));
        }
    }

    public void setPostStateCompatiblity(Lattice lattice, VariableState state) {
        this.data.forEach((key, entry) -> {
            entry.compatibleWithFinalPostState = entry.postVariableState.isCompatibleWith(lattice, state);
        });
    }

    @Data
    @Serdeable
    public class IFbCStatementInfo {
        List<IFbCStatementInfo> children = new LinkedList<>();
        VariableState postVariableState = null;
        Lattice.Level contextLevel = null;
        Boolean compatibleWithFinalPostState = null;
    }
}
