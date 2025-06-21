import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CBCFormula } from '../../project/CBCFormula';
import { environment } from '../../../../environments/environment';
import { Observable, Subject, catchError, map, of } from 'rxjs';
import { Refinement } from '../../../types/refinement';
import { ConditionDTO } from '../../../types/condition/condition';
import { SimpleStatementComponent } from '../../../components/editor/statements/simple-statement/simple-statement.component';
import { VerificationService } from '../verification/verification.service';
import { NetworkStatusService } from '../../networkStatus/network-status.service';
import { ConsoleService } from '../../console/console.service';
import { Renaming } from '../Renaming';
import { ProjectService } from '../../project/project.service';

/**
 * The Service to send the editor contents over the network to the backend for verification, code generation or converting the xml files from CorC to emfjson compatible struture.
 * @see AppComponent
 * @see EditorComponent
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkTreeService {
  private static readonly verifyPath = "/editor/verify"
  private static readonly generatePath = "/editor/javaGen"

  constructor(
    private readonly http: HttpClient,
    private readonly verificationService : VerificationService,
    private readonly networkStatusService : NetworkStatusService,
    private readonly consoleService : ConsoleService,
    private readonly projectService : ProjectService,
  ) { }

  /**
   * Verify the given arguments via the backend with key
   * @param root The root refinement to verify
   * @param javaVariables The Java variables used to verify
   * @param globalConditions The global conditions used to verify 
   * @param renaming The renaming used to verify
   * @param projectId The id of the project, is used to give backend more context in form of the helper.key in the project
   */
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
      .post<CBCFormula>(environment.apiUrl + NetworkTreeService.verifyPath, formula, { params: params })
      .pipe(catchError((error : HttpErrorResponse) : Observable<CBCFormula> => {
        this.consoleService.addErrorResponse(error, "Verification failed")
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe((formula: CBCFormula) => {
        this.verificationService.next(formula)
        this.networkStatusService.stopNetworkRequest()
        this.projectService.downloadWorkspace()
      })
  }


  /**
   * Use the backend to generate code based on the refinements
   * @param root The root refinement used to generate the code
   * @param javaVariables The variables used to generate the code
   * @param globalConditions The global conditions used to generate the code
   * @param renaming The renamings used to generate the code
   * @param name The name of the file to generate the code in
   * @param projectId The id of the project, is used to give backend more context in form of the helper.key in the project
   */
  public generateCode(root: Refinement | undefined, javaVariables : string[], globalConditions : ConditionDTO[], renaming : Renaming[], name : string ,  projectId?: string | undefined) {
    const filename = name.substring(0, name.lastIndexOf('.'))
    const rootNode = (root as SimpleStatementComponent).export()
    const formula = new CBCFormula()
    formula.statement = rootNode.refinement
    formula.preCondition = rootNode.preCondition
    formula.postCondition = rootNode.postCondition
    formula.javaVariables = javaVariables
    formula.globalConditions = globalConditions
    formula.renaming = renaming
    formula.name = filename

    let params =  new HttpParams()

    if (projectId) {
      params = params.set('projectId', projectId)
    }

    this.networkStatusService.startNetworkRequest()
    this.http.post(environment.apiUrl + NetworkTreeService.generatePath, formula, {params : params, responseType: 'text' as const})
    .pipe(map(string => string))
    .pipe(catchError((error : HttpErrorResponse) : Observable<string> => {
      this.consoleService.addErrorResponse(error, "Java code generation failed")
      this.networkStatusService.stopNetworkRequest()
      return of()
    }))
    .subscribe((code) => {
      const blob = new Blob([code], {type: "text/plain"})
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename  + ".java"
      a.click()
      window.URL.revokeObjectURL(url)
      this.networkStatusService.stopNetworkRequest()
    })
  }
}
