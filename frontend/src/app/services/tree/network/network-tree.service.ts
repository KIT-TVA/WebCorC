import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CBCFormula, ICBCFormula } from "../../../types/CBCFormula";
import { environment } from "../../../../environments/environment";
import { catchError, map, Observable, of } from "rxjs";
import { VerificationService } from "../verification/verification.service";
import { NetworkStatusService } from "../../networkStatus/network-status.service";
import { ConsoleService } from "../../console/console.service";
import { ProjectService } from "../../project/project.service";
import { CbcFormulaMapperService } from "../../project/mapper/cbc-formula-mapper.service";
import { WebSocketService } from "./websocket";

/**
 * The Service to send the editor contents over the network to the backend for verification or code generation.
 * @see AppComponent
 * @see EditorComponent
 */
@Injectable({
  providedIn: "root",
})
export class NetworkTreeService {
  private static readonly verifyPath = "/editor/verify";
  private static readonly verifyWebSocketPath = "/ws/verify/";
  private static readonly verifyResultPath = "/editor/jobs/";
  private static readonly generatePath = "/editor/javaGen";

  constructor(
    private readonly http: HttpClient,
    private readonly mapper: CbcFormulaMapperService,
    private readonly verificationService: VerificationService,
    private readonly networkStatusService: NetworkStatusService,
    private readonly consoleService: ConsoleService,
    private readonly projectService: ProjectService,
  ) {}

  /**
   * Verify the given arguments via the backend with key
   * @param root The root refinement to verify
   * @param projectId The id of the project, is used to give backend more context in form of the helper.key in the project
   */
  public verify(root: CBCFormula | undefined, projectId?: string | undefined) {
    let params = new HttpParams();

    if (projectId) {
      params = params.set("projectId", projectId);
    }

    this.networkStatusService.startNetworkRequest();

    this.http
      .post<string>(
        environment.apiUrl + NetworkTreeService.verifyPath,
        root,
        { params: params },
      ).pipe(
        catchError((error: HttpErrorResponse): Observable<string> => {
          this.consoleService.addErrorResponse(error, "Verification failed");
          this.networkStatusService.stopNetworkRequest();
          return of();
        }),
      ).subscribe((uuid: string) => {
        let ws = new WebSocketService(
          environment.apiUrl + NetworkTreeService.verifyWebSocketPath + uuid
        );
        ws.messages$.subscribe((msg: string) => {
          if (msg === "verification complete") {
            ws.disconnect();
            this.networkStatusService.startNetworkRequest();
            this.http.get<ICBCFormula>(
              environment.apiUrl + NetworkTreeService.verifyResultPath + uuid
            ).pipe(
              map((formula) => this.mapper.importFormula(formula))
            ).subscribe(
              (formula: CBCFormula) => {
                this.verificationService.next(formula);
                this.networkStatusService.stopNetworkRequest()
                this.projectService.downloadWorkspace()
              }
            )
          }
          //TODO: consoleService needs an endpoint for non-errors
          this.consoleService.addStringError("", msg);
        })
      });
  }

  /**
   * Use the backend to generate code based on the refinements
   * @param root The root refinement used to generate the code
   * @param projectId The id of the project, is used to give backend more context in form of the helper.key in the project
   */
  public generateCode(
    root: CBCFormula | undefined,
    projectId?: string | undefined,
  ) {
    let params = new HttpParams();

    if (projectId) {
      params = params.set("projectId", projectId);
    }

    this.networkStatusService.startNetworkRequest();
    this.http
      .post(environment.apiUrl + NetworkTreeService.generatePath, root, {
        params: params,
        responseType: "text" as const,
      })
      .pipe(map((string) => string))
      .pipe(
        catchError((error: HttpErrorResponse): Observable<string> => {
          this.consoleService.addErrorResponse(
            error,
            "Java code generation failed",
          );
          this.networkStatusService.stopNetworkRequest();
          return of();
        }),
      )
      .subscribe((code) => {
        const blob = new Blob([code], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = root?.name + ".java";
        a.click();
        window.URL.revokeObjectURL(url);
        this.networkStatusService.stopNetworkRequest();
      });
  }
}
