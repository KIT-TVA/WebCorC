import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ICBCFormula, LocalCBCFormula } from "../../../types/CBCFormula";
import { environment } from "../../../../environments/environment";
import { catchError, map, Observable, of } from "rxjs";
import { VerificationService } from "../verification/verification.service";
import { NetworkStatusService } from "../../networkStatus/network-status.service";
import { ConsoleService } from "../../console/console.service";
import { ProjectService } from "../../project/project.service";
import { CbcFormulaMapperService } from "../../project/mapper/cbc-formula-mapper.service";
import { WebSocketService } from "./websocket";
import { ApiDiagramFile } from "../../project/types/api-elements";

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
   * @param urn urn of the file being verified, used to update the file in the project with the verification result
   */
  public verify(
    root: LocalCBCFormula | undefined,
    projectId: string | undefined,
    urn: string,
  ) {
    let params = new HttpParams();

    if (projectId) {
      params = params.set("projectId", projectId);
    }

    this.networkStatusService.startNetworkRequest();

    this.http
      .post<string>(
        environment.apiUrl + NetworkTreeService.verifyPath,
        root
          ? new ApiDiagramFile("", this.mapper.exportFormula(root), "file")
              .content
          : undefined,
        {
          params: params,
        },
      )
      .pipe(
        catchError((error: HttpErrorResponse): Observable<string> => {
          this.consoleService.addErrorResponse(error, "Verification failed");
          this.networkStatusService.stopNetworkRequest();
          return of();
        }),
      )
      .subscribe((uuid: string) => {
        const ws = new WebSocketService(
          environment.apiUrl + NetworkTreeService.verifyWebSocketPath + uuid,
        );
        ws.messages$.subscribe((msg: string) => {
          if (msg === "verification complete") {
            ws.disconnect();
            this.networkStatusService.startNetworkRequest();
            this.http
              .get<ICBCFormula>(
                environment.apiUrl + NetworkTreeService.verifyResultPath + uuid,
              )
              .pipe(map((formula) => this.mapper.importFormula(formula)))
              .subscribe((formula: LocalCBCFormula) => {
                this.verificationService.next(formula, urn);
                this.networkStatusService.stopNetworkRequest();
                this.projectService.downloadWorkspace();
              });
          }
          this.verificationService.verifyInfo(msg);

          //TODO: consoleService needs an endpoint for non-errors
        });
      });
  }

  /**
   * Use the backend to generate code based on the refinements
   * @param root The root refinement used to generate the code
   * @param projectId The id of the project, is used to give backend more context in form of the helper.key in the project
   */
  public generateCode(
    root: LocalCBCFormula | undefined,
    projectId?: string | undefined,
  ) {
    let params = new HttpParams();

    if (projectId) {
      params = params.set("projectId", projectId);
    }

    this.networkStatusService.startNetworkRequest();
    this.http
      .post(
        environment.apiUrl + NetworkTreeService.generatePath,
        root ? this.mapper.exportFormula(root) : undefined,
        {
          params: params,
          responseType: "text" as const,
        },
      )
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
