import {Condition} from "./condition";

/**
 * Class for hardcoding the title of the  preconditions
 */
export class Precondition extends Condition {
  constructor(originId: number, content: string = "") {
    super(originId, "Precondition", content);
  }

  override get title(): string {
    return this._title;
  }
}
