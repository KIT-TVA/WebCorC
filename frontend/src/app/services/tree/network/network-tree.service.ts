import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CBCFormula } from '../../project/CBCFormula';
import { environment } from '../../../../environments/environment';
import { Observable, Subject, catchError, map, of } from 'rxjs';
import { EMFCbcFormula } from '../emf/emf-cbc-formula';
import { EmfMapperService } from '../emf/emf-mapper.service';
import { Refinement } from '../../../types/refinement';
import { ConditionDTO } from '../../../types/condition/condition';
import { SimpleStatementComponent } from '../../../components/editor/statements/simple-statement/simple-statement.component';
import { VerificationService } from '../verification/verification.service';
import { NetworkStatusService } from '../../networkStatus/network-status.service';
import { ConsoleService } from '../../console/console.service';
import { Renaming } from '../Renaming';

@Injectable({
  providedIn: 'root'
})
export class NetworkTreeService {
  private static readonly verifyPath = "/editor/verify"
  private static readonly generatePath = "/editor/generate"
  private static readonly converstionPath = "/editor/xmltojson"

  private readonly _generateStatus = new Subject<string>()
  private readonly _conversionResponse = new Subject<CBCFormula>()

  constructor(
    private readonly http: HttpClient,
    private readonly mapper : EmfMapperService,
    private readonly verificationService : VerificationService,
    private readonly networkStatusService : NetworkStatusService,
    private readonly consoleService : ConsoleService
  ) { }

  public verify(root : Refinement | undefined, javaVariables : string[], globalConditions : ConditionDTO[], renaming : Renaming[], projectId? : string | undefined) {

    const rootNode = (root as SimpleStatementComponent).export()
    const formula = new CBCFormula()
    formula.statement = rootNode.refinement
    formula.preCondition = rootNode.preCondition
    formula.postCondition = rootNode.postCondition
    formula.javaVariables = javaVariables
    formula.globalConditions = globalConditions
    formula.renaming = renaming

    let params =  new HttpParams()

    if (projectId) {
      params = params.set('projectId', projectId)
    }


    this.networkStatusService.startNetworkRequest()
    //Todo: Websocket?
    this.http
      .post<EMFCbcFormula>(environment.apiUrl + NetworkTreeService.verifyPath, this.mapper.toEMFCbcFormula(formula), { params: params })
      .pipe(map(formula => this.mapper.toCBCFormula(formula)))
      .pipe(catchError((error : HttpErrorResponse) : Observable<CBCFormula> => {
        console.log(error)
        this.consoleService.addErrorResponse(error, "Verification failed")
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe((formula: CBCFormula) => {
        this.verificationService.next(formula)
        this.networkStatusService.stopNetworkRequest()
      })
  }


  public convertCBCModel(cbcmodel : string) {

    this.networkStatusService.startNetworkRequest()

    this.http
    .post<EMFCbcFormula>(environment.apiUrl + NetworkTreeService.converstionPath, cbcmodel, {
      headers : {
        'Content-Type': 'application/xml'
      }
    })
    .pipe(map(formula => this.mapper.toCBCFormula(formula)))
    .pipe(catchError((error : HttpErrorResponse) : Observable<CBCFormula> => {
      this.consoleService.addErrorResponse(error, "Converting .cbcmodel file to emf json")
      this.networkStatusService.stopNetworkRequest()
      return of()
    }))
    .subscribe((formula : CBCFormula) => {
      this._conversionResponse.next(formula)
      this.networkStatusService.stopNetworkRequest()
    })
  }

  public get conversionResponse() {
    return this._conversionResponse
  }
}