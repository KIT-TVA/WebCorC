## Mutation Generation
The mutation feature allows the mutation of refinements that contain Java code with [MuJava](https://cs.gmu.edu/~offutt/mujava/). Furthermore, mutating conditions via a separate mutation module that does not use MuJava is possible.
Every mutant is generated as a new CbC program and can be found inside the `mutations` folder inside the project.
Resulting CbC programs are not guaranteed to be correct according to their specification.
### Code Mutation
To mutate any applicable refinement rule inside CorC, proceed as follows:
1. Select the refinement rule.
2. Navigate to the 'Mutations' in the properties window.
3. Select the desired mutation operators and press the mutate button.

**Code Mutation Example**

Suppose the statement `i = i + 1;` is part of a CbC program in CorC. Some possible mutations for this statement are:
- `i = i - 1;`
- `i = i * 1;`
- `i = i / 1;`
- `i = i % 1;`

### Condition Mutation
To mutate conditions follow:
1. Select a condition.
2. Navigate to the 'Mutations' in the properties window.
3. Select the desired mutation operators and press the mutate button.

**Condition Mutation Example**

Given the condition `i > 0 -> TRUE`, some possible mutations are the following
- `i >= 0 -> TRUE`
- `i < 0 -> TRUE`
- `i == 0 -> TRUE`
- `i != 0 -> TRUE`
