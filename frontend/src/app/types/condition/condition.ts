import {Observable, ReplaySubject, debounceTime, distinctUntilChanged} from "rxjs";

/**
 * Conditon edited in the Condtion Editor
 */
export class Condition {
  protected readonly _title: string;
  private _content: string;
  private _contentChangeEmitter: ReplaySubject<string>;


  private _originId: number;

  constructor(originId: number, title: string = "", content: string = "") {
    this._originId = originId;
    this._title = title;
    this._content = content;
    this._contentChangeEmitter = new ReplaySubject();
  }

  export(): ConditionDTO {
    return new ConditionDTO(this._originId, this._title, this._content);
  }

  get content(): string {
    return this._content;
  }

  get title(): string {
    return this._title + " (#" + this.originId + ")";
  }

  get originId(): number {
    return this._originId;
  }

  get contentChangeObservable(): Observable<string> {
    return this._contentChangeEmitter.pipe(debounceTime(100), distinctUntilChanged());
  }

  set content(value: string) {
    this._content = value.trim();
    this._contentChangeEmitter.next(this._content)
  }

  set originId(id : number) {
    this._originId = id
  }
}

export interface IConditionDTO {
  originId : number,
  title : string
  content : string
}

/**
 * Data only conditon class to use in the data only classes.
 * Compatible with the api calls for the backend
 */
export class ConditionDTO implements IConditionDTO {

  public constructor(
    public originId : number,
    public title : string = "",
    public content : string = "",
  ) {}

  public convert() : Condition {
    return new Condition(this.originId, this.title, this.content)
  }
}
