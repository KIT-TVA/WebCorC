export interface JmlSyntaxError {
  message: string;
  start: number;
  end: number;
}

type TokenKind = "identifier" | "keyword" | "number" | "operator" | "separator";

interface Token {
  kind: TokenKind;
  value: string;
  start: number;
  end: number;
}

const BINARY_OPERATOR_PRECEDENCE: ReadonlyMap<string, number> = new Map([
  ["*", 1],
  ["/", 1],
  ["%", 1],
  ["+", 2],
  ["-", 2],
  ["<", 3],
  ["<=", 3],
  [">", 3],
  [">=", 3],
  ["==", 4],
  ["!=", 4],
  ["&", 5],
  ["^", 6],
  ["|", 7],
  ["&&", 8],
  ["||", 9],
  ["==>", 10],
  ["<=>", 10],
]);

const MAX_PRECEDENCE = Math.max(...BINARY_OPERATOR_PRECEDENCE.values());

const JML_KEYWORDS: readonly string[] = ["\\forall", "\\exists", "\\old"];

const KEYWORDS: readonly string[] = ["int"];

const SEPARATORS: readonly string[] = ["(", ")", ".", "[", "]", ";", ","];

const SINGLE_CHAR_OPERATORS: readonly string[] = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "~",
  "^",
];

const WHITESPACE: readonly string[] = [" ", "\t", "\r", "\n"];

const MAX_INT_LITERAL = 2147483647;

const MAX_QUOTED_LENGTH = 20;

function quote(input: string): string {
  return input.length > MAX_QUOTED_LENGTH
    ? `'${input.substring(0, MAX_QUOTED_LENGTH)}…'`
    : `'${input}'`;
}

class JmlSyntaxException extends Error {
  constructor(
    message: string,
    public readonly start: number,
    public readonly end: number,
  ) {
    super(message);
  }
}

function isIdentifierChar(c: string): boolean {
  return /^[0-9A-Za-z_]$/.test(c);
}

function isDigit(c: string): boolean {
  return /^[0-9]$/.test(c);
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  const push = (kind: TokenKind, value: string) => {
    tokens.push({ kind, value, start: pos, end: pos + value.length });
    pos += value.length;
  };

  const readWhile = (from: number, predicate: (c: string) => boolean) => {
    let end = from;
    while (end < source.length && predicate(source[end])) {
      end++;
    }
    return source.substring(from, end);
  };

  while (pos < source.length) {
    const c = source[pos];
    const next = source[pos + 1];
    const afterNext = source[pos + 2];

    if (WHITESPACE.includes(c)) {
      pos++;
    } else if (SEPARATORS.includes(c)) {
      push("separator", c);
    } else if (SINGLE_CHAR_OPERATORS.includes(c)) {
      push("operator", c);
    } else if (c === "&" || c === "|") {
      push("operator", next === c ? c + c : c);
    } else if (c === "\\") {
      const name = "\\" + readWhile(pos + 1, isIdentifierChar);
      if (!JML_KEYWORDS.includes(name)) {
        throw new JmlSyntaxException(
          `Unknown JML keyword ${quote(name)}, expected one of ${JML_KEYWORDS.join(", ")}`,
          pos,
          pos + name.length,
        );
      }
      push("operator", name);
    } else if (c === "<") {
      push("operator", next === "=" ? (afterNext === ">" ? "<=>" : "<=") : "<");
    } else if (c === ">") {
      push("operator", next === "=" ? ">=" : ">");
    } else if (c === "!") {
      push("operator", next === "=" ? "!=" : "!");
    } else if (c === "=") {
      if (next !== "=") {
        throw new JmlSyntaxException(
          "Assignment '=' is not allowed in a condition, use '==' for equality",
          pos,
          pos + 1,
        );
      }
      push("operator", afterNext === ">" ? "==>" : "==");
    } else if (isDigit(c)) {
      push("number", readWhile(pos, isDigit));
    } else if (isIdentifierChar(c)) {
      const name = readWhile(pos, isIdentifierChar);
      push(KEYWORDS.includes(name) ? "keyword" : "identifier", name);
    } else {
      throw new JmlSyntaxException(`Invalid character '${c}'`, pos, pos + 1);
    }
  }

  return tokens;
}

class ConditionSyntaxParser {
  private idx = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly sourceLength: number,
  ) {}

  public parseCondition(): void {
    this.parseExpression();
    if (this.hasMore()) {
      const token = this.peek();
      throw this.errorAt(
        token,
        `Unexpected ${quote(token.value)}, expected an operator or the end of the condition`,
      );
    }
  }

  private parseExpression(): void {
    this.parseExpressionWithPrecedence(MAX_PRECEDENCE);
  }

  private parseExpressionWithPrecedence(precedence: number): void {
    this.parseOperand(precedence);
    while (
      this.hasMore() &&
      this.binaryPrecedence(this.peek()) === precedence
    ) {
      this.idx++;
      this.parseOperand(precedence);
    }
  }

  private parseOperand(precedence: number): void {
    if (precedence <= 1) {
      this.parseFactor();
    } else {
      this.parseExpressionWithPrecedence(precedence - 1);
    }
  }

  private parseFactor(): void {
    const token = this.expectMore("an expression");

    if (this.is(token, "separator", "(")) {
      this.idx++;
      this.parseExpression();
      this.expect("separator", ")");
      return;
    }

    if (
      this.is(token, "operator", "-") ||
      this.is(token, "operator", "!") ||
      this.is(token, "operator", "~")
    ) {
      this.idx++;
      this.parseFactor();
      return;
    }

    if (this.is(token, "operator", "\\old")) {
      this.idx++;
      this.expect("separator", "(");
      this.expectIdentifier();
      this.expect("separator", ")");
      return;
    }

    if (
      this.is(token, "operator", "\\forall") ||
      this.is(token, "operator", "\\exists")
    ) {
      this.idx++;
      this.expect("keyword", "int");
      this.expectIdentifier();
      this.expect("separator", ";");
      this.expect("separator", "(");
      this.parseExpression();
      this.expect("separator", ")");
      return;
    }

    if (token.kind === "identifier") {
      this.idx++;
      const following = this.hasMore() ? this.peek() : undefined;
      if (following && this.is(following, "separator", "(")) {
        this.parseCallArguments();
      } else if (following && this.is(following, "separator", "[")) {
        this.idx++;
        this.parseExpression();
        this.expect("separator", "]");
      } else if (following && this.is(following, "separator", ".")) {
        this.idx++;
        this.expectIdentifier();
      }
      return;
    }

    if (token.kind === "number") {
      if (Number(token.value) > MAX_INT_LITERAL) {
        throw this.errorAt(
          token,
          `Number ${quote(token.value)} is too large, the maximum is ${MAX_INT_LITERAL}`,
        );
      }
      this.idx++;
      return;
    }

    throw this.errorAt(
      token,
      `Unexpected ${quote(token.value)}, expected an expression`,
    );
  }

  private parseCallArguments(): void {
    this.expect("separator", "(");
    if (this.hasMore() && this.is(this.peek(), "separator", ")")) {
      this.idx++;
      return;
    }
    while (true) {
      this.parseExpression();
      const token = this.expectMore("',' or ')'");
      if (this.is(token, "separator", ")")) {
        this.idx++;
        return;
      }
      if (!this.is(token, "separator", ",")) {
        throw this.errorAt(
          token,
          `Expected ',' or ')' but found ${quote(token.value)}`,
        );
      }
      this.idx++;
    }
  }

  private binaryPrecedence(token: Token): number | undefined {
    return token.kind === "operator"
      ? BINARY_OPERATOR_PRECEDENCE.get(token.value)
      : undefined;
  }

  private expect(kind: TokenKind, value: string): void {
    const token = this.expectMore(`'${value}'`);
    if (!this.is(token, kind, value)) {
      throw this.errorAt(
        token,
        `Expected '${value}' but found ${quote(token.value)}`,
      );
    }
    this.idx++;
  }

  private expectIdentifier(): void {
    const token = this.expectMore("an identifier");
    if (token.kind !== "identifier") {
      throw this.errorAt(
        token,
        `Expected an identifier but found ${quote(token.value)}`,
      );
    }
    this.idx++;
  }

  private expectMore(expected: string): Token {
    if (!this.hasMore()) {
      throw new JmlSyntaxException(
        `Unexpected end of condition, expected ${expected}`,
        this.sourceLength,
        this.sourceLength,
      );
    }
    return this.peek();
  }

  private is(token: Token, kind: TokenKind, value: string): boolean {
    return token.kind === kind && token.value === value;
  }

  private hasMore(): boolean {
    return this.idx < this.tokens.length;
  }

  private peek(): Token {
    return this.tokens[this.idx];
  }

  private errorAt(token: Token, message: string): JmlSyntaxException {
    return new JmlSyntaxException(message, token.start, token.end);
  }
}

export function checkJmlSyntax(
  condition: string | null | undefined,
): JmlSyntaxError | null {
  if (!condition || condition.trim() === "") {
    return null;
  }

  try {
    const tokens = tokenize(condition);
    new ConditionSyntaxParser(tokens, condition.length).parseCondition();
    return null;
  } catch (e) {
    if (e instanceof JmlSyntaxException) {
      return { message: e.message, start: e.start, end: e.end };
    }
    throw e;
  }
}
