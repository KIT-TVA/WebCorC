## WebCorC Refinement Rules
WebCorC's refinement rules build a superset of IFbC's refinement rules. Additional refinement rules are:
- **declassify(E) Operator** | Evaluate the expression *E* without evaluating its security level. This can be used anywhere where an expression can be used, e.g. in the guard of a selection statement to lower the induced security context level.

##  IFbC Example
Since the introduction is somewhat abstract, we examine how IFbC works in a simple example. We want to create a program that will subtract the value of the *public*, but *untrtusted* variable *cost* from *secret* variable *balance* and stores the value in *balance* if its greater than `0`. It then assigns the value of the *balance* to the *public* variable *ret* only if the *private* variable *permission* is set to `1`. Otherwise *ret* will be set to `-1`. Note that we will not find suitable pre/postconditions to ensure the correctness of the programm as in [CbC][../cbc/example.md].

A Java programm implementing this behaviour could look like this:
```java
class Account {
    private int permission;
    /*secret*/ private int balance;

    public int recordTransaction(int cost) {
        int newBalance = this.balance - cost;
        if (newBalance > 0) {
            this.balance = newBalance;
        }
        if (this.permission == 1) {
            return this.balance;
        } else {
            return -1;
        }
    }
}
```

This is the pre variable state *V^pre^* of the above situation:

|  Variable  | Confidentiality | Integrity |
|:----------:|:---------------:|:---------:|
|  balance   |     secret      |  trusted  |
| newBalance |     public      |  trusted  |
|    cost    |     public      | untrusted |
|    ret     |     public      |  trusted  |
| permission |     private     |  trusted  |

*newBalance*  will be used as an intermediary variable to store the result of the operation.
We expect at the end a variable state *V^post^* similar to:

|  Variable  | Confidentiality | Integrity |
|:----------:|:---------------:|:---------:|
|  balance   |     secret      |  trusted  |
| newBalance |     secret      | untrusted |
|    cost    |     public      | untrusted |
|    ret     |     public      |  trusted  |
| permission |     private     |  trusted  |

The above abstract programm can be refined into the following `CbC` programm (without pre/postconditions):
`newBalance := balance - cost; if newBalance > 0 -> balance := newBalance fi; if permission == 1 -> ret := balance elseif permission == 0 -> ret := -1;`

Without any modification, this will result in the following post variable state:

|  Variable  | Confidentiality | Integrity |
|:----------:|:---------------:|:---------:|
|  balance   |     secret      | untrusted |
| newBalance |     secret      | untrusted |
|    cost    |     public      | untrusted |
|    ret     |     secret      | untrusted |
| permission |     private     |  trusted  |

To improve on this, we first need to ensure that `newBalance` contains a value which can be trusted before assigning it to `balance`. We can achieve this by e.g.:
    - Check that `cost` can be trusted in the operation `balance - cost` by ensuring that no incorrect value can be produced. We can then use the `declassify assignment` rule: `newBalance := declassify(balance - cost)`
    - Use the already present `selection` rule `if newBalance > 0 -> balance := newBalance fi` for this. However, we have to declassify all uses of `newBalance` for this to ensure that also the context security level is considered as `trusted`:  
    `if declassify(newBalance) > 0 -> balance := declassify(newBalance) fi`
    Instead of the `declassify` operator in the guard, we can also introduce a new variable `checked` which extracts the `guard` into a new `declassify assignment`.  
This keeps the integrity of `balance` as `trusted` and thus also the integrity of `ret`. To now keep the confidentiality of `ret`, we need to declassify the usage of `ret` by using a `declassify assignment`: `if permission == 1 -> ret := declassify(balance)`.

However, this only leads to `ret` being `private` as the context security level of this `selection` statement is `private` due to `permission` being used in the guard. To fix this, we can either introduce a new variable and use a `declassify assignment` or by using the `declassify operator` in the guard(s):
`if declassify(permission) == 1 -> ret := declassify(balance) elseif declassify(permission) == 0 -> ret := -1 fi;`

So the final IFbC programm which conforms to the information flow given by the above mentioned V^pre^ and V^post^ could be this:
```
newBalance := balance - cost; 
if declassify(newBalance) > 0 -> balance := declassify(newBalance) fi; 
if declassify(permission) == 1 -> ret := declassify(balance) 
elseif declassify(permission) == 0 -> ret := -1 fi;
```

This programm could now be implemented in `WebCorC` and be proven to respect the specified information flow.

## WebCorC Example
We implement this program now in WebCorC:

1. Create a new Diagram-File called `transaction`: `Menu -> New -> Diagram-Button`
2. Enable IFbC: `Settings (Gear Icon at the top) -> IFbC switch`
3. Create the used variables:
    1. Open the variables ribbon: `Global -> Java Variables`.
    2. Add every variable
4. Assign the desired pre security levels on the left-hand side of the `Root` node:
    - Click on a drop-down menu and select the corresponding level.
    - Both for confidentiality and integrity for every variable
5. Repeat the previous step for the post security levels on the right-hand side.
6. Implement the program according to the [CbC Example](../cbc/example.md#cbc-example).
    - Don't forget to add the `declassify`'s where needed
7. Verify the program by clicking the `Check IFbC` button at the top of the root node.
8. Inspect the calculated post security levels per node by clicking on the `i` at the top right of every node (except of the root node).
