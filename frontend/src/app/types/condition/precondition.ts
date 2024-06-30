import {Condition} from "./condition";

export class Precondition extends Condition {
  constructor(originId: number, content: string = "") {
    super(originId, "Precondition", content);
  }

  override get title(): string {
    return this._title;
  }
}
