import {Injectable, signal} from "@angular/core";
import {ResetVariant} from "../types/ResetVariant";

@Injectable({
    providedIn: "root",
})
export class GlobalSettingsService {
    public conditionsAlwaysOpen: boolean = true;
    public showMiniMap: boolean = false;
    private _resetVariant = signal<ResetVariant>(
        ResetVariant.ReingoldTilford
    );

    readonly resetVariant = this._resetVariant.asReadonly();

    setResetVariant(variant: ResetVariant) {
        this._resetVariant.set(variant);
    }
}
