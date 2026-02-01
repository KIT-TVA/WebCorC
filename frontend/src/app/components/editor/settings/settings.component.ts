import {Component} from '@angular/core';
import {MatRadioButton, MatRadioGroup} from "@angular/material/radio";
import {FormsModule} from "@angular/forms";
import {ResetVariant} from "../../../types/ResetVariant";

@Component({
    selector: 'app-settings',
    imports: [
        MatRadioButton,
        MatRadioGroup,
        FormsModule
    ],
    templateUrl: './settings.component.html',
    standalone: true,
    styleUrl: './settings.component.css'
})
export class SettingsComponent {
    private _resetVariant: ResetVariant = ResetVariant.ReingoldTilford

    public get resetVariant() {
        return this._resetVariant;
    };
    public set resetVariant(resetVariant: ResetVariant){
        this._resetVariant = resetVariant;
    };

    protected readonly ResetVariant = ResetVariant;
}
