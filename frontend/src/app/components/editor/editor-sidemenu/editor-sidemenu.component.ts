import { Component, signal, ViewChild } from "@angular/core";
import { TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { Button } from "primeng/button";
import { OptionsComponent } from "../options/options.component";
import { RenamingComponent } from "../renaming/renaming.component";
import { GlobalConditionsComponent } from "../global-conditions/global-conditions.component";
import { VariablesComponent } from "../variables/variables.component";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from "primeng/accordion";
import { AiChatComponent } from "../../ai-chat/ai-chat.component";
import { ConsoleComponent } from "../../console/console.component";
import { PredicateManagerComponent } from "../predicate-manager/predicate-manager.component";

@Component({
  selector: "app-editor-sidemenu",
  imports: [
    Tabs,
    TabPanels,
    TabPanel,
    Button,
    OptionsComponent,
    RenamingComponent,
    GlobalConditionsComponent,
    VariablesComponent,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    AiChatComponent,
    ConsoleComponent,
    PredicateManagerComponent,
  ],
  templateUrl: "./editor-sidemenu.component.html",
  standalone: true,
  styleUrl: "./editor-sidemenu.component.scss",
})
export class EditorSidemenuComponent {
  @ViewChild("variables") public variables!: VariablesComponent;
  @ViewChild("conditions") public conditions!: GlobalConditionsComponent;
  @ViewChild("renaming") public renaming!: RenamingComponent;

  tabValue = signal(0);
  setTab(value: number): void {
    if (this.tabValue() == value) {
      this.tabValue.set(0);
    } else {
      this.tabValue.set(value);
    }
  }

  compactButton = {
    root: {
      sm: {
        paddingX: "0.2rem",
      },
      paddingX: "0px",
    },
    button: {
      paddingX: "0px",
      root: {
        sm: {
          paddingX: "0px",
        },
      },
    },
  };
}
