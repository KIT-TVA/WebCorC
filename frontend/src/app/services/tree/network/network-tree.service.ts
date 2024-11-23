import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CBCFormula } from '../../project/CBCFormula';
import { environment } from '../../../../environments/environment';
import { Subject } from 'rxjs';
import { EMFCbcFormula } from '../emf/emf-cbc-formula';
import { EmfMapperService } from '../emf/emf-mapper.service';
import { Refinement } from '../../../types/refinement';
import { ConditionDTO } from '../../../types/condition/condition';
import { SimpleStatementComponent } from '../../../components/editor/statements/simple-statement/simple-statement.component';

@Injectable({
  providedIn: 'root'
})
export class NetworkTreeService {
  private static readonly verifyPath = "/editor/verify"
  private static readonly generatePath = "/editor/generate"

  private readonly _networkActivity = new Subject<boolean>()
  private readonly _verifyStatus = new Subject<EMFCbcFormula>()
  private readonly _generateStatus = new Subject<string>()

  constructor(private readonly http: HttpClient, private readonly mapper : EmfMapperService) { }

  public verify(root : Refinement | undefined, javaVariables : string[], globalConditions : ConditionDTO[]) {

    const rootNode = (root as SimpleStatementComponent).export()
    const formula = new CBCFormula()
    formula.statement = rootNode
    formula.javaVariables = javaVariables
    formula.globalConditions = globalConditions

    this._networkActivity.next(true)

    this.http
      .post<EMFCbcFormula>(environment.apiUrl + NetworkTreeService.verifyPath, this.mapper.toEMFCbcFormula(formula))
      .subscribe((formula) => {
        this._verifyStatus.next(formula)
        this._networkActivity.next(false)
      })

  }
}
