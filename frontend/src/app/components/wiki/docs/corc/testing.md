## Test Case Generation
The CorC ecosystem includes a test generation extension that generates test cases for single refinements of CbC programs. Depending on the program's complexity, we may provide custom input values for the supported data types through the `Testing` tab in the Eclipse property view. The extension also supports automatic input generation, either by use of default values for data types or through SMT solving with the [Z3](https://github.com/Z3Prover/z3/releases) SMT-solver. After the generation of test cases, the extension uses [TestNG](https://testng.org/) to execute those test cases. Successfully tested refinements will be highlighted in orange in the graphical editor. Furthermore, the console outputs testing status information. If a test case fails, the console will provide the user with detailed error information, and the corresponding refinement will be changed to red in the graphical editor. This extension is also available in the LOST-Editor.
Test one or more refinements in the graphical editor by:
1. Configure the test case generation extension through the `Properties -> Testing` tab.
2. Right-click a refinement or anywhere else in a CbC method diagram.
3. Select `Test` and a suitable testing option.
4. *(Optional)* Navigate to the `Console` tab to view status information during and after testing.
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/testing-window.png]]
