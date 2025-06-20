## Verification
Verifying entire CbC programs and single refinement rules in CorC is possible through the deductive verifier [KeY](https://www.key-project.org/thebook2/). There are two ways to verify CbC programs in CorC. Through the [graphical editor](#verification-in-the-graphical-editor) and the [textual editor](#verification-in-the-textual-editor). The verification process is identical for both extensions. Once the verification process is started, CorC generates proof obligations for KeY in `.key` files found in the current project folder. Every time KeY provides output, CorC shows status information depending on the response from KeY. Afterward, the verification results are saved in `.proof` files next to their corresponding `.key` files. All successfully verified refinements are highlighted in green in the graphical editor if the verification was successful. If the proof for a refinement rule is not closeable, CorC will highlight the refinement in red.

### Verification in the Graphical Editor
- Open the console property view through `Window -> Show View -> Console` to monitor the verification process.

*Verifying all refinements*:
1. Right-click anywhere in a CbC diagram.
2. Select `Verify -> Verify All Statements`.

*Verifying single refinements*:
1. Right-click on any refinement.
2. Select `Verify -> Verify a statement`.

### Verification in the Textual Editor
1. Open the console property view through `Window -> Show View -> Console` to monitor the verification process.
2. Open the [LOST-editor](#textual-editor).
3. Press the button `Load`.
4. Press the button `Verify`.

