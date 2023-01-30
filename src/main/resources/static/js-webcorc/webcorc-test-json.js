$("#context-menu-button-other").click(function () {
    var testData = {
  "CorcInput": {
    "type": "CBCFormula",
    "name": "FactorialGraphical",
    "preCondition": {
      "name": "n >= 0"
    },
    "postCondition": {
      "name": "f = frac(n)"
    },
    "proven": "true",
    "comment": "",
    "compositionTechnique": "CONTRACT_OVERRIDING",
    "className": "",
    "methodName": "",
    "statement": {
      "type": "SelectionStatement",
      "name": "SelectionStatement",
      "preCondition": {
        "name": "n >= 0"
      },
      "postCondition": {
        "name": "f = frac(n)"
      },
      "preProven": "true",
      "guard1": "n = 0",
      "guard2": "n = 1",
      "guard3": "n >= 2",
      "statement1": {
        "type": "AbstractStatement",
        "name": "AbstractStatement1",
        "statementCondition": {
          "name": "f = 1;"
        },
        "preCondition": {
          "name": "(n >= 0) &amp; (n = 0)"
        },
        "postCondition": {
          "name": "f = frac(n)"
        },
        "proven": "true",
        "comment": ""
      },
      "statement2": {
        "type": "AbstractStatement",
        "name": "AbstractStatement2",
        "statementCondition": {
          "name": "f = 1;"
        },
        "preCondition": {
          "name": "(n >= 0) &amp; (n = 1)"
        },
        "postCondition": {
          "name": "f = frac(n)"
        },
        "proven": "true",
        "comment": ""
      },
      "statement3": {
        "type": "AbstractStatement",
        "name": "AbstractStatement3",
        "statementCondition": {
          "name": "f = n * frac(n-1);"
        },
        "preCondition": {
          "name": "(n >= 0) &amp; (n >= 2)"
        },
        "postCondition": {
          "name": "f = frac(n)"
        },
        "proven": "true",
        "comment": ""
      }
    }
  }
};

    $.ajax({
        type: "POST",
        url: "http://localhost:8080/testjson",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(testData),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
                alert(data);
            },
        error: function(errMsg) {
                alert(errMsg);
            }
    });

/*
    $.getJSON("http://localhost:8080/testjson","parameter="+testData,function (result) {
        $.each(result, function(i, field){
            $("#canvas").append(field + " ");
        });
    })
*/

});