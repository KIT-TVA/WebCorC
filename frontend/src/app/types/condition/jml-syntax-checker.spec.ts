import { checkJmlSyntax } from "./jml-syntax-checker";

describe("checkJmlSyntax", () => {
  describe("valid conditions", () => {
    // all conditions of the example projects and the backend test fixtures
    const exampleConditions = [
      "i > 7",
      "appears(A, x, 0, A.length)",
      "A[i] == x",
      "appears(A, x, 0, A.length) && i == A.length-1",
      "!appears(A,x,i+1,A.length) && (A[i] != x)",
      "A[i]==x",
      "i",
      "(A[i] != x)",
      "A != null",
      "i >= 0 && i < A.length",
      "maxe(A, 0, A.length, i)",
      "A.length > 0 && i == 0 && j == 1",
      "maxe(A,0,j,i) && (j!=A.length) && A[j] <= A[i]",
      "A.length - j",
      "true",
      "newBalance == balance + x && newBalance >= limit",
      "containsOldElements(A, \\old(A)) && sort(A)",
      "partSort(A,i) && i < A.length && j == A.length-2",
      "partSort(A,i) && (\\forall int h; (j < h && h < A.length ==> A[j+1] <= A[h])) && j>=i",
      "partSort(A,i) && (\\forall int h; (j < h && h < A.length ==> A[j+1] <= A[h])) && j>=i & A[j] > A[j+1]",
      "(\\forall int m; (0 <= m && m < A.length ==> (\\forall int n; (0 <= n && n < A.length ==> (m != n ==> A[m] != A[n])))))",
      "(\\old(balance) + x >= limit ==> balance == \\old(balance) + x) && " +
        "(\\old(balance) + x < limit ==> balance == \\old(balance))",
      "i == \\old(i) + 1",
      "newBalance == balance+x",
    ];

    for (const condition of exampleConditions) {
      it(`accepts example condition '${condition}'`, () => {
        expect(checkJmlSyntax(condition)).toBeNull();
      });
    }

    const otherValidConditions = [
      "a * b / c % d + e - f",
      "a | b ^ c & d",
      "a || b && c",
      "a <=> b",
      "a ==> b ==> c",
      "-a < ~b",
      "!!a",
      "- -a",
      "f()",
      "f(g(a, h()), A[f(i)])",
      "\\exists int k; (A[k] == x)",
      "\\forall int k; (k > 0) && k2 > 0",
      "this.x == 0",
      "i == 2147483647",
      "a\n&& b",
      "\t a  ==  b \r\n",
      "_a1 == B_2",
    ];

    for (const condition of otherValidConditions) {
      it(`accepts '${JSON.stringify(condition)}'`, () => {
        expect(checkJmlSyntax(condition)).toBeNull();
      });
    }

    it("does not report empty conditions", () => {
      expect(checkJmlSyntax("")).toBeNull();
      expect(checkJmlSyntax("   \n ")).toBeNull();
      expect(checkJmlSyntax(null)).toBeNull();
      expect(checkJmlSyntax(undefined)).toBeNull();
    });
  });

  describe("invalid conditions", () => {
    const invalidConditions: {
      condition: string;
      start: number;
      end: number;
      message: string;
    }[] = [
      // lexer errors
      {
        condition: "a = b",
        start: 2,
        end: 3,
        message:
          "Assignment '=' is not allowed in a condition, use '==' for equality",
      },
      {
        condition: "a <==> b",
        start: 4,
        end: 5,
        message:
          "Assignment '=' is not allowed in a condition, use '==' for equality",
      },
      {
        condition: "a => b",
        start: 2,
        end: 3,
        message:
          "Assignment '=' is not allowed in a condition, use '==' for equality",
      },
      {
        condition: "a # b",
        start: 2,
        end: 3,
        message: "Invalid character '#'",
      },
      {
        condition: "a ? b : c",
        start: 2,
        end: 3,
        message: "Invalid character '?'",
      },
      {
        condition: "\\result == 0",
        start: 0,
        end: 7,
        message:
          "Unknown JML keyword '\\result', expected one of \\forall, \\exists, \\old",
      },
      {
        condition: "a == \\",
        start: 5,
        end: 6,
        message:
          "Unknown JML keyword '\\', expected one of \\forall, \\exists, \\old",
      },
      // unexpected end
      {
        condition: "a >",
        start: 3,
        end: 3,
        message: "Unexpected end of condition, expected an expression",
      },
      {
        condition: "(a > b",
        start: 6,
        end: 6,
        message: "Unexpected end of condition, expected ')'",
      },
      {
        condition: "f(a",
        start: 3,
        end: 3,
        message: "Unexpected end of condition, expected ',' or ')'",
      },
      {
        condition: "f(",
        start: 2,
        end: 2,
        message: "Unexpected end of condition, expected an expression",
      },
      {
        condition: "A[i",
        start: 3,
        end: 3,
        message: "Unexpected end of condition, expected ']'",
      },
      {
        condition: "A.",
        start: 2,
        end: 2,
        message: "Unexpected end of condition, expected an identifier",
      },
      // unexpected tokens
      {
        condition: "a > b c",
        start: 6,
        end: 7,
        message:
          "Unexpected 'c', expected an operator or the end of the condition",
      },
      {
        condition: "a > b)",
        start: 5,
        end: 6,
        message:
          "Unexpected ')', expected an operator or the end of the condition",
      },
      {
        condition: "A[i].length > 0",
        start: 4,
        end: 5,
        message:
          "Unexpected '.', expected an operator or the end of the condition",
      },
      {
        condition: "a.b.c",
        start: 3,
        end: 4,
        message:
          "Unexpected '.', expected an operator or the end of the condition",
      },
      {
        condition: "A[i][j]",
        start: 4,
        end: 5,
        message:
          "Unexpected '[', expected an operator or the end of the condition",
      },
      {
        condition: "a ! b",
        start: 2,
        end: 3,
        message:
          "Unexpected '!', expected an operator or the end of the condition",
      },
      {
        condition: "1abc",
        start: 1,
        end: 4,
        message:
          "Unexpected 'abc', expected an operator or the end of the condition",
      },
      {
        condition: "a && && b",
        start: 5,
        end: 7,
        message: "Unexpected '&&', expected an expression",
      },
      {
        condition: "()",
        start: 1,
        end: 2,
        message: "Unexpected ')', expected an expression",
      },
      {
        condition: "int > 0",
        start: 0,
        end: 3,
        message: "Unexpected 'int', expected an expression",
      },
      {
        condition: "f(a b)",
        start: 4,
        end: 5,
        message: "Expected ',' or ')' but found 'b'",
      },
      {
        condition: "f(a,)",
        start: 4,
        end: 5,
        message: "Unexpected ')', expected an expression",
      },
      {
        condition: "f(,a)",
        start: 2,
        end: 3,
        message: "Unexpected ',', expected an expression",
      },
      {
        condition: "A[i)",
        start: 3,
        end: 4,
        message: "Expected ']' but found ')'",
      },
      {
        condition: "A.0",
        start: 2,
        end: 3,
        message: "Expected an identifier but found '0'",
      },
      // JML constructs outside the supported subset
      {
        condition: "\\old(A[i])",
        start: 6,
        end: 7,
        message: "Expected ')' but found '['",
      },
      {
        condition: "\\old(1)",
        start: 5,
        end: 6,
        message: "Expected an identifier but found '1'",
      },
      {
        condition: "\\forall boolean b; (b)",
        start: 8,
        end: 15,
        message: "Expected 'int' but found 'boolean'",
      },
      {
        condition: "\\forall int i (i > 0)",
        start: 14,
        end: 15,
        message: "Expected ';' but found '('",
      },
      {
        condition: "\\forall int i; i > 0",
        start: 15,
        end: 16,
        message: "Expected '(' but found 'i'",
      },
      {
        condition: "\\exists int i; 0 <= i; (A[i] == x)",
        start: 15,
        end: 16,
        message: "Expected '(' but found '0'",
      },
      {
        condition: "(\\forall int i; (i > 0)",
        start: 23,
        end: 23,
        message: "Unexpected end of condition, expected ')'",
      },
      // numbers
      {
        condition: "i == 2147483648",
        start: 5,
        end: 15,
        message: "Number '2147483648' is too large, the maximum is 2147483647",
      },
    ];

    for (const { condition, start, end, message } of invalidConditions) {
      it(`rejects '${condition}'`, () => {
        expect(checkJmlSyntax(condition)).toEqual({ message, start, end });
      });
    }
  });
});
