import {Observable, ReplaySubject, debounceTime, distinctUntilChanged} from "rxjs";

export class Condition {
  protected readonly _title: string;
  private _content: string;
  private _contentChangeEmitter: ReplaySubject<string>;

  // The refinement this condition is initiated.
  // 0 for side condition.
  private _originId: number;

  constructor(originId: number, title: string = "", content: string = "") {
    this._originId = originId;
    this._title = title;
    this._content = content;
    this._contentChangeEmitter = new ReplaySubject();
  }

  export(): any {
    return {content: this.content, originID: this.originId, title: this.title};
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
