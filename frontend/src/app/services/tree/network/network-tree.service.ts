import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CBCFormula } from '../../project/CBCFormula';
import { environment } from '../../../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkTreeService {
  private static readonly verifyPath = "/editor/verify"
  private static readonly generatePath = "/editor/generate"

  private readonly _networkActivity = new Subject<boolean>()
  private readonly _verifyStatus = new Subject<CBCFormula>()
  private readonly _generateStatus = new Subject<string>()

  constructor(private readonly http: HttpClient) { }

  public verify(formula : CBCFormula) {

    this._networkActivity.next(true)

    this.http
      .post<CBCFormula>(environment.apiUrl + NetworkTreeService.verifyPath, formula)
      .subscribe((formula) => {
        this._verifyStatus.next(formula)
        this._networkActivity.next(false)
      })

  }
}
