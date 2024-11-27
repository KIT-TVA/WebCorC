import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  private _reload = new Subject<void>()

  constructor() { }




  public get reload() {
    return this._reload
  }
}
