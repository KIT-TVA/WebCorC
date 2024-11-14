import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConsoleService } from '../../console/console.service';
import { CBCFormula } from '../../project/CBCFormula';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NetworkTreeService {
  private static readonly verifyPath = "/editor/verify"
  private static readonly generatePath = "/editor/generate"

  private readonly _verifyStatus = new Subject<CBCFormula>()
  private readonly _generateStatus = new Subject<string>()
  private readonly _networkActivity = new Subject<boolean>()

  constructor(private readonly http : HttpClient, private readonly consoleService : ConsoleService) { }

  public verify(formula : CBCFormula) {

    this._networkActivity.next(true)

    this.http
      .post<CBCFormula>(environment.apiUrl + NetworkTreeService.verifyPath, formula) 
      .subscribe((formula) => {
        this._verifyStatus.next(formula)
        this._networkActivity.next(false)
      })
  }

  public generate(formula : CBCFormula) {

    this._networkActivity.next(true)

    this.http
      .post<string>(environment.apiUrl + NetworkTreeService.generatePath, formula)
      .subscribe((content) => {
        this._generateStatus.next(content)
        this._networkActivity.next(false)
      })
  }



  get verifyStatus() {
    return this._verifyStatus
  }

  get generateStatus() {
    return this._generateStatus
  }
}
