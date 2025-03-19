import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service to share the network status between the different network services.
 * 
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {

  private _status = new Subject<boolean>();

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
