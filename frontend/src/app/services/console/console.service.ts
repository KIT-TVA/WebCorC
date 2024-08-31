import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  private _ttyChange = new ReplaySubject<string>()

  constructor() {

  }

  get ttyChange() {
    return this._ttyChange
  }
}
