import {Component, Input, output} from "@angular/core";

import {MatIconModule} from "@angular/material/icon";
import {SpeedDial} from "primeng/speeddial";
import {MenuItem} from "primeng/api";
import {StatementType} from "../../types/statements/abstract-statement";

/**
 * Button in the add refinement widget
 */
@Component({
    selector: "app-refinement-widget",
    imports: [MatIconModule, SpeedDial],
    template: `
        <div style="overflow: visible; position: relative; width: 5rem; height: 5em; display: flex; justify-content: center; align-content: center; align-items: center">
            <div style="overflow: visible;width: fit-content; height: fit-content">
                <div style="overflow: visible;position: relative">
                    <p-speed-dial [model]="items" id="background" radius="55" type="semi-circle" direction="down"
                                  [buttonProps]="{severity: 'secondary'}"
                                  [tooltipOptions]="{ tooltipPosition: 'top' }">
                    </p-speed-dial>
                </div>
            </div>
        </div>
    `,
    standalone: true,
    styles: `

    `
})
export class RefinementWidgetComponent {
    @Input() icon: string = "";
    @Input() text: string = "";
    select = output<StatementType>();

    items: MenuItem[] = [
        {label: "Statement", icon: "pi pi-angle-double-right", component: "STATEMENT", command: () =>{
            this.select.emit("STATEMENT")
            }},
        {label: "Selection", icon: "pi pi-sitemap", component: "SELECTION", command: () =>{
                this.select.emit("SELECTION")
            }},
        {label: "Composition", icon: "pi pi-link", component: "COMPOSITION", command: () =>{
                this.select.emit("COMPOSITION")
            }},
        {label: "Repetition", icon: "pi pi-sync", component: "REPETITION", command: () =>{
                this.select.emit("REPETITION")
            }},
        {label: "Strong-Weak", icon: "pi pi-lock-open", component: "SKIP", command: () =>{
                this.select.emit("SKIP")
            }}
    ];
}
