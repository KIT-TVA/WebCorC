import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class NetworkTreeService {
  private static readonly verifyPath = "/editor/verify"
  private static readonly generatePath = "/editor/generate"

  private readonly _generateStatus = new Subject<string>()

  constructor(
    private readonly http: HttpClient,
    private readonly mapper : EmfMapperService,
    private readonly verificationService : VerificationService,
    private readonly networkStatusService : NetworkStatusService,
    private readonly consoleService : ConsoleService
  ) { }

  public verify(root : Refinement | undefined, javaVariables : string[], globalConditions : ConditionDTO[]) {

    const rootNode = (root as SimpleStatementComponent).export()
    const formula = new CBCFormula()
    formula.statement = rootNode.refinement
    formula.preCondition = rootNode.preCondition
    formula.postCondition = rootNode.postCondition
    formula.javaVariables = javaVariables
    formula.globalConditions = globalConditions

    this.networkStatusService.startNetworkRequest()
    //Todo: Websocket?
    this.http
      .post<EMFCbcFormula>(environment.apiUrl + NetworkTreeService.verifyPath, this.mapper.toEMFCbcFormula(formula))
      .pipe(map(formula => this.mapper.toCBCFormula(formula)))
      .pipe(catchError((error : HttpErrorResponse) : Observable<CBCFormula> => {
        this.consoleService.addErrorResponse(error, "Verification failed")
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe((formula: CBCFormula) => {
        this.verificationService.next(formula)
        this.networkStatusService.stopNetworkRequest()
      })
  }
}