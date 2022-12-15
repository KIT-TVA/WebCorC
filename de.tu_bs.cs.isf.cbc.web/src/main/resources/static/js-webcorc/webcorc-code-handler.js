/***********************************************************************************************************************
 * the following code ... (TODO)
 */

    // let defaultJavaCodeMirror = CodeMirror(document.getElementById("dummyCorcCodeArea"), {
    //     value: "class DemoClass {\n" +
    //         "  public void main(String[] args){\n" +
    //         "    System.out.println(\"hello World!\");\n" +
    //         "  }\n" +
    //         "}",
    //     mode: "text/x-java",
    //     lineNumbers: "true",
    //     extraKeys: {"Ctrl-Space": "autocomplete"}
    // });


function createCodeMirrorInstance( className = "", content = "class "+className+"{\n" +
"  public void main(String[] args){\n" +
"  }\n" +
"}") {
    let instance = CodeMirror(document.getElementById("dummyCorcCodeArea"), {
        value: content ,
        mode: "text/x-java",
        lineNumbers: "true",
        extraKeys: {"Ctrl-Space": "autocomplete"}
    });
}


// function codeHandler(domTextField) {
//     // console.log(domTextField.value);
//     sendCodeAsString(domTextField.value);
//     console.log("send code");
// }

// $(function() {
//     $(".corc-code-area").linedtextarea();
// });

function compileCode() {
    console.log("compilation triggered");
    let code = $(".corc-code-area").first()[0].innerText;
    sendCodeAsString(code);
}
