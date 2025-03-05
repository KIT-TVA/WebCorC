import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  private _reload = new Subject<void>()

  private _currentFileName : string = ""

  constructor() { }

  public get reload() {
    return this._reload
  }


  public set currentFileName(currentFileName : string) {
    this._currentFileName= currentFileName
  }

  public get currentFileName() : string {
    return this._currentFileName
  }
}
