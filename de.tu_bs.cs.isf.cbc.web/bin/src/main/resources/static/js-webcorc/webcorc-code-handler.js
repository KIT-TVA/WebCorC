/***********************************************************************************************************************
 * the following code ... (TODO)
 */

let defaultJavaCodeMirror = CodeMirror(document.getElementById("dummyCorcCodeArea"), {
    value: "class DemoClass {\n" +
        "  public void main(String[] args){\n" +
        "    System.out.println(\"hello World!\");\n" +
        "  }\n" +
        "}",
    mode: "text/x-java",
    lineNumbers: "true",
    extraKeys: {"Ctrl-Space": "autocomplete"}
});


// function codeHandler(domTextField) {
//     // console.log(domTextField.value);
//     sendCodeAsString(domTextField.value);
//     console.log("send code");
// }

// $(function() {
//     $(".corc-code-area").linedtextarea();
// });

function printConsole(message) {
    $("#corcConsole").html(message);
    // alert("Message printed to console");
}

function compileCode() {
    console.log("compilation triggered");
    let code = $(".corc-code-area").first()[0].innerText;
    sendCodeAsString(code);
}
