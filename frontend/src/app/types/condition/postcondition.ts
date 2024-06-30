import {Condition} from "./condition";

export class Postcondition extends Condition {
  constructor(originId: number, content: string = "") {
    super(originId, "Postcondition", content);
  }

  override get title(): string {
    return this._title;
  }
}
