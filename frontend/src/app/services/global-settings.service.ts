import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class GlobalSettingsService {
  public conditionsAlwaysOpen: boolean = true;
}
