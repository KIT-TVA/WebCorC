import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {

  private _status = new Subject<boolean>();
  private _error = false


  constructor() { }

  public startNetworkRequest() {
    this._status.next(true)
  }

  public stopNetworkRequest() {
    this._status.next(false)
  }

  get status() {
    return this._status
  }
}
