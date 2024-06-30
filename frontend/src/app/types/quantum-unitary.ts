export class QuantumUnitary {
  private _content: string;

  constructor(content: string = "") {
    this._content = content;
  }

  get content(): string {
    return this._content;
  }

  set content(value: string) {
    this._content = value;
  }

  export(): any {
    return {content: this.content};
  }
}
