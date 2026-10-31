import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { VerifierCatalog } from "../../../types/Verifier";

/**
 * Service for fetching the Verifier Catalog from the backend via http rest calls.
 * Holds no state and does no interpretation — sorting, console reporting and the
 * fallback live in the owning `VerifierService`.
 */
@Injectable({
  providedIn: "root",
})
export class VerifierNetworkService {
  private http = inject(HttpClient);

  private static readonly catalogPath = "/editor/verifiers";

  /**
   * Fetch the Verifier Catalog from `GET /editor/verifiers`.
   * @returns The Catalog exactly as the backend serves it; errors propagate to the caller.
   */
  public fetchCatalog(): Observable<VerifierCatalog> {
    return this.http.get<VerifierCatalog>(
      environment.apiUrl + VerifierNetworkService.catalogPath,
    );
  }
}
