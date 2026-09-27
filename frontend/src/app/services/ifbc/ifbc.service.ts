import { Injectable, signal } from "@angular/core";
import { ProjectService } from "../project/project.service";
import { IFBCFormula, IFBCVerificationResult } from "../../types/IFBCFormula";
import { TreeService } from "../tree/tree.service";
import {
  ConfidentialityLattice,
  defaultConfidentialityLattice,
  defaultIntegrityLattice,
  ILattice,
  ILatticeLevel,
  IntegrityLattice,
  LatticeLevel,
} from "../../types/ifbc/lattice";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { environment } from "../../../environments/environment";
import {
  APIVariableIFbCState,
  toVariableStateIDMapping,
  VariableIFbCState,
} from "../../types/ifbc/variableState";
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  Observable,
  of,
} from "rxjs";
import { RootStatementComponent } from "../../components/editor/statements/root-statement/root-statement.component";
import { AbstractStatementNode } from "../../types/statements/nodes/abstract-statement-node";
import { RootStatement } from "../../types/statements/root-statement";
import { IFbCVerificationResultHandlerService } from "../tree/confidentiality/network-confidentiality-job.service";
import { WebSocketService } from "../tree/network/websocket";
import { CbcFormulaMapperService } from "../project/mapper/cbc-formula-mapper.service";
import { ConsoleService } from "../console/console.service";

type LatticeGetResponse = {
  lattice: {
    minimalLevel: {
      id: number;
      name: string;
      parentIDs: number[];
    };
    levels: {
      id: number;
      name: string;
      parentIDs: number[];
    }[];
  };
  preVariableState: APIVariableIFbCState;
  postVariableState: APIVariableIFbCState;
};

/**
 * Service to distribute the verification result from the http response to the tree service.
 * @see TreeService
 */
@Injectable({
  providedIn: "root",
})
export class IFbCService {
  private static readonly checkConfidentialityPath = "/ifbc/editor/verify";
  private static readonly checkConfidentialityWebSocketPath = "/ifbc/ws/verify/";
  private static readonly checkConfidentialityResultPath = "/ifbc/editor/jobs/";

  constructor(
    private readonly http: HttpClient,
    private projectService: ProjectService,
    private treeService: TreeService,
    private readonly confidentialityService: IFbCVerificationResultHandlerService,
    private readonly mapper: CbcFormulaMapperService,
    private readonly consoleService: ConsoleService,
  ) {
    this.treeService.variableUpdateNotifier.subscribe(() => {
      this.variables = this.treeService.variables;
      this.preVariableState$.next({
        confidentiality: this.adjustVariables(
          this.preVariableState$.value.confidentiality,
          this.variables,
          this.confidentialityLattice$.value,
        ),
        integrity: this.adjustVariables(
          this.preVariableState$.value.integrity,
          this.variables,
          this.integrityLattice$.value,
        ),
      });
      this.postVariableState$.next({
        confidentiality: this.adjustVariables(
          this.postVariableState$.value.confidentiality,
          this.variables,
          this.confidentialityLattice$.value,
        ),
        integrity: this.adjustVariables(
          this.postVariableState$.value.integrity,
          this.variables,
          this.integrityLattice$.value,
        ),
      });
    });

    this.projectService.editorNotify.subscribe(() => {
      const confidentialityLattice = this.confidentialityLattice$.getValue();
      if (confidentialityLattice) {
        this.saveConfidentialityLattice(confidentialityLattice.levels);
      }
      const integrityLattice = this.integrityLattice$.getValue();
      if (integrityLattice) {
        this.saveIngetrityLattice(integrityLattice.levels);
      }
    });
  }

  private rootStatement: RootStatementComponent | undefined = undefined;
  public readonly isCheckingConfidentiality = signal(false);

  private variables: string[] = [];

  private readonly confidentialityLattice$ = new BehaviorSubject<
    ConfidentialityLattice | undefined
  >(undefined);
  private readonly integrityLattice$ = new BehaviorSubject<
    IntegrityLattice | undefined
  >(undefined);
  private readonly preVariableState$ = new BehaviorSubject<VariableIFbCState>({
    confidentiality: {},
    integrity: {},
  });
  private readonly postVariableState$ = new BehaviorSubject<VariableIFbCState>({
    confidentiality: {},
    integrity: {},
  });

  private confidentialityLatticeLoaded = false;
  private integrityLatticeLoaded = false;
  private skipNextConfidentialityUpdate = false;
  private skipNextIntegrityUpdate = false;

  private withDefaultLatticeLevel(
    state: { [variable: string]: ILatticeLevel | undefined } | undefined,
    variables: string[],
    lattice: ILattice | undefined,
  ): { [variable: string]: ILatticeLevel } {
    const entries = state
      ? Object.entries(state)
      : variables.map((v) => [v, undefined]);
    return Object.fromEntries(
      entries.map(([k, v]) => [k, v ?? lattice?.minimalLevel]),
    );
  }

  private adjustVariables(
    current: { [variable: string]: ILatticeLevel },
    variables: string[],
    lattice: ILattice | undefined,
  ) {
    const adjustedLevels = {
      ...this.withDefaultLatticeLevel(undefined, variables, lattice),
      ...current,
    };
    return Object.fromEntries(
      Object.entries(adjustedLevels).filter(([k, v]) => variables.includes(k)),
    );
  }

  private mapVariableStateResponse(
    variableState: APIVariableIFbCState | undefined,
    lattice: ILattice,
  ): { [variable: string]: ILatticeLevel } {
    if (variableState !== undefined) {
      return Object.fromEntries(
        Object.entries(variableState).map(([k, v]) => [
          k,
          !!v ? lattice.levelById(v) : lattice.minimalLevel,
        ]),
      );
    }
    return {};
  }

  private correctApiConfidentialityLattice(
    lattice: LatticeGetResponse["lattice"],
  ): ConfidentialityLattice {
    return new ConfidentialityLattice(
      lattice.levels.map(
        ({ id, name, parentIDs }) =>
          new LatticeLevel(id, name, parentIDs ?? []),
        lattice.minimalLevel,
      ),
    );
  }

  private correctApiIntegrityLattice(
    lattice: LatticeGetResponse["lattice"],
  ): IntegrityLattice {
    return new IntegrityLattice(
      lattice.levels.map(
        ({ id, name, parentIDs }) => new LatticeLevel(id, name, parentIDs),
        lattice.minimalLevel,
      ),
    );
  }

  public initData(
    confidentialityLattice: ConfidentialityLattice,
    integrityLattice: IntegrityLattice,
    preVariableState: VariableIFbCState,
    postVariableState: VariableIFbCState,
  ) {
    this.confidentialityLatticeLoaded = confidentialityLattice !== undefined;
    this.integrityLatticeLoaded = integrityLattice !== undefined;
    this.confidentialityLattice$.next(confidentialityLattice);
    this.integrityLattice$.next(integrityLattice);
    this.preVariableState$.next(preVariableState);
    this.postVariableState$.next(postVariableState);
    this.skipNextConfidentialityUpdate = true;
    this.skipNextIntegrityUpdate = true;
  }

  public get confidentialityLattice(): Observable<ConfidentialityLattice> {
    if (!this.confidentialityLatticeLoaded) {
      this.confidentialityLatticeLoaded = true;
      const params = this.projectService.projectId
        ? { projectId: this.projectService.projectId }
        : undefined;
      this.http
        .get<LatticeGetResponse>(
          environment.apiUrl + "/ifbc/editor/lattice/confidentiality",
          { params },
        )
        .pipe(
          map((resp) => {
            const lattice = this.correctApiConfidentialityLattice(resp.lattice);
            return {
              lattice,
              preVariableState: this.mapVariableStateResponse(
                resp.preVariableState,
                lattice,
              ),
              postVariableState: this.mapVariableStateResponse(
                resp.postVariableState,
                lattice,
              ),
            };
          }),
        )
        .subscribe(({ lattice, preVariableState, postVariableState }) => {
          if (this.skipNextConfidentialityUpdate) {
            this.skipNextConfidentialityUpdate = false;
            return;
          }
          this.confidentialityLattice$.next(lattice);
          this.preVariableState$.next({
            confidentiality: this.adjustVariables(
              preVariableState,
              this.variables,
              lattice,
            ),
            integrity: this.preVariableState$.value.integrity,
          });
          this.postVariableState$.next({
            confidentiality: this.adjustVariables(
              postVariableState,
              this.variables,
              lattice,
            ),
            integrity: this.postVariableState$.value.integrity,
          });
        });
    }
    return this.confidentialityLattice$.pipe(
      filter((lattice) => lattice !== undefined),
    );
  }

  public get preVariableState(): Observable<VariableIFbCState> {
    return this.preVariableState$.asObservable();
  }

  public get postVariableState(): Observable<VariableIFbCState> {
    return this.postVariableState$.asObservable();
  }

  public storePreVariableState(state: VariableIFbCState) {
    this.preVariableState$.next(state);
  }

  public storePostVariableState(state: VariableIFbCState) {
    this.postVariableState$.next(state);
  }

  public get integrityLattice(): Observable<IntegrityLattice> {
    if (!this.integrityLatticeLoaded) {
      this.integrityLatticeLoaded = true;
      const params = this.projectService.projectId
        ? { projectId: this.projectService.projectId }
        : undefined;
      this.http
        .get<LatticeGetResponse>(
          environment.apiUrl + "/ifbc/editor/lattice/integrity",
          { params },
        )
        .pipe(
          map((resp) => {
            const lattice = this.correctApiIntegrityLattice(resp.lattice);
            return {
              lattice,
              preVariableState: this.mapVariableStateResponse(
                resp.preVariableState,
                lattice,
              ),
              postVariableState: this.mapVariableStateResponse(
                resp.postVariableState,
                lattice,
              ),
            };
          }),
        )
        .subscribe(({ lattice, preVariableState, postVariableState }) => {
          if (this.skipNextIntegrityUpdate) {
            this.skipNextIntegrityUpdate = false;
            return;
          }
          this.integrityLattice$.next(lattice);
          this.preVariableState$.next({
            integrity: this.adjustVariables(
              preVariableState,
              this.variables,
              lattice,
            ),
            confidentiality: this.preVariableState$.value.confidentiality,
          });
          this.postVariableState$.next({
            integrity: this.adjustVariables(
              postVariableState,
              this.variables,
              lattice,
            ),
            confidentiality: this.postVariableState$.value.confidentiality,
          });
        });
    }

    return this.integrityLattice$.pipe(
      filter((lattice) => lattice !== undefined),
    );
  }

  public validateLattice(levels: ILatticeLevel[]) {
    return this.http.post<LatticeGetResponse["lattice"]>(
      environment.apiUrl + "/ifbc/editor/lattice/validate",
      { levels },
    );
  }

  public saveConfidentialityLattice(levels: ILatticeLevel[]) {
    if (this.projectService.projectId === undefined) {
      // reuse the validation to get the correct lattice
      // as we cannot save without a project.
      return this.validateLattice(levels)
        .pipe(map((lattice) => this.correctApiIntegrityLattice(lattice)))
        .subscribe((lattice) => {
          this.confidentialityLattice$.next(lattice);
        });
    }
    const params = this.projectService.projectId
      ? { projectId: this.projectService.projectId }
      : undefined;
    return this.http
      .post<LatticeGetResponse>(
        environment.apiUrl + "/ifbc/editor/lattice/confidentiality",
        {
          levels,
          preVariableState: toVariableStateIDMapping(
            this.preVariableState$.value,
            true,
          ).confidentiality,
          postVariableState: toVariableStateIDMapping(
            this.postVariableState$.value,
            true,
          ).confidentiality,
        },
        { params },
      )
      .pipe(map((resp) => this.correctApiIntegrityLattice(resp.lattice)))
      .subscribe((lattice) => {
        this.confidentialityLattice$.next(lattice);
      });
  }

  public saveIngetrityLattice(levels: ILatticeLevel[]) {
    if (this.projectService.projectId === undefined) {
      // reuse the validation to get the correct lattice
      // as we cannot save without a project.
      return this.validateLattice(levels)
        .pipe(map((lattice) => this.correctApiIntegrityLattice(lattice)))
        .subscribe((lattice) => {
          this.integrityLattice$.next(lattice);
        });
    }
    const params = this.projectService.projectId
      ? { projectId: this.projectService.projectId }
      : undefined;
    return this.http
      .post<LatticeGetResponse>(
        environment.apiUrl + "/ifbc/editor/lattice/integrity",
        {
          levels,
          preVariableState: toVariableStateIDMapping(
            this.preVariableState$.value,
            true,
          ).integrity,
          postVariableState: toVariableStateIDMapping(
            this.postVariableState$.value,
            true,
          ).integrity,
        },
        { params },
      )
      .pipe(map((resp) => this.correctApiIntegrityLattice(resp.lattice)))
      .subscribe((lattice) => {
        this.integrityLattice$.next(lattice);
      });
  }

  public registerRootStatement(statement: RootStatementComponent) {
    this.rootStatement = statement;
  }

  public verifyConfidentiality(
    checkConfidentiality: boolean,
    checkIntegrity: boolean,
  ): void {
    if (this.rootStatement === undefined || this.isCheckingConfidentiality()) {
      return;
    }
    this.isCheckingConfidentiality.set(true);

    // Finalize statements first
    this.treeService.finalizeStatements();

    // Create temporary formula from this node
    const tempFormula = this.treeService.createTempFormulaFromNode(
      this.rootStatement!._node,
    );

    const tempIFBCFormula = IFBCFormula.fromCBCFormula(
      {
        ...tempFormula,
        preCondition: this.rootStatement!._node.precondition.getValue(),
        postCondition: this.rootStatement._node.postcondition.getValue(),
      },
      this.confidentialityLattice$.value!,
    );
    tempIFBCFormula.preVariables = this.preVariableState$.value;
    tempIFBCFormula.postVariables = this.postVariableState$.value;

    // Verify the statement
    this.checkConfidentialityStatement(
      tempIFBCFormula,
      this.confidentialityLattice$.value ?? defaultConfidentialityLattice,
      this.integrityLattice$.value ?? defaultIntegrityLattice,
      this.rootStatement._node,
      this.projectService.projectId,
      checkConfidentiality,
      checkIntegrity,
      this.treeService.urn,
      () => {
        this.isCheckingConfidentiality.set(false);
      },
    );
  }

  /**
   * Check the confidentiality of a single statement and its subtree via the backend
   * @param formula The temporary formula containing the statement to verify
   * @param statementNode The statement node being verified
   * @param projectId The id of the project
   * @param urn urn of the file being verified
   * @param onComplete Callback to execute when verification completes (success or error)
   */
  public checkConfidentialityStatement(
    formula: IFBCFormula,
    confidentialityLattice: ConfidentialityLattice,
    integrityLattice: IntegrityLattice,
    statementNode: AbstractStatementNode,
    projectId: string | undefined,
    checkConfidentiality: boolean,
    checkIntegrity: boolean,
    urn: string,
    onComplete: () => void,
  ) {
    let params = new HttpParams();

    if (projectId) {
      params = params.set("projectId", projectId);
    }

    this.http
      .post<string>(
        environment.apiUrl + IFbCService.checkConfidentialityPath,
        {
          name: formula.name,
          javaVariables: formula.javaVariables,
          renamings: formula.renamings,
          level: formula.level.id,
          preVariableState: toVariableStateIDMapping(formula.preVariables),
          postVariableState: toVariableStateIDMapping(formula.postVariables),
          postCondition: formula.postCondition,
          preCondition: formula.preCondition,
          statement: (formula.statement as RootStatement).statement,
          respectsConfidentiality: false,
          confidentialityLattice,
          integrityLattice,
          checkConfidentiality,
          checkIntegrity,
        },
        {
          params: params,
        },
      )
      .pipe(
        catchError((error: HttpErrorResponse): Observable<string> => {
          // Handle 500 and other errors
          console.log(error);
          if (error.status === 500 || error.status >= 400) {
            // Mark statement as unverified
            statementNode.statement.isConfidential = false;
            statementNode.statement.isIntegral = false;
            this.treeService.refreshNodes();
            this.consoleService.addErrorResponse(
              error,
              `IFbC check failed for statement "${statementNode.statement.name}": ${error.error._embedded.errors[0].message}`,
            );
            onComplete();
            return of();
          }
          onComplete();
          return of();
        }),
      )
      .subscribe((uuid: string) => {
        if (!uuid) {
          // Empty UUID means error was handled in catchError
          return;
        }
        const ws = new WebSocketService(
          environment.apiUrl +
            IFbCService.checkConfidentialityWebSocketPath +
            uuid,
        );
        ws.messages$.subscribe((msg: string) => {
          if (msg.includes("ifbc check complete")) {
            ws.disconnect();
            this.http
              .get<IFBCVerificationResult>(
                environment.apiUrl +
                  IFbCService.checkConfidentialityResultPath +
                  uuid,
              )
              .pipe(
                map((formula) => ({
                  formula: this.mapper.importFormula(formula),
                  response: formula,
                })),
              )
              .subscribe(({ formula, response }) => {
                this.confidentialityService.nextStatement(
                  formula,
                  response.context,
                  statementNode,
                  urn,
                );
                onComplete();
              });
          } else if (msg.includes("unable to check for confidentiality")) {
            statementNode.statement.isConfidential = false;
            this.treeService.refreshNodes();
            this.consoleService.addStringError(
              msg,
              `IFbC check failed for statement "${statementNode.statement.name}": ${msg}`,
            );
          } else if (msg.includes("unable to check for integrity")) {
            statementNode.statement.isIntegral = false;
            this.treeService.refreshNodes();
            this.consoleService.addStringError(
              msg,
              `IFbC check failed for statement "${statementNode.statement.name}": ${msg}`,
            );
          } else if (msg.includes("ifbc check complete")) {
            ws.disconnect();
          }
          this.confidentialityService.verifyInfo(msg);
        });
      });
  }
}
