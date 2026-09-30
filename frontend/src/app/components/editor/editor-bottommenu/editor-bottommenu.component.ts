import { Component, signal } from "@angular/core";
import {
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@openng/optimus-ui/tabs";
import { Button } from "@openng/optimus-ui/button";
import { ConsoleComponent } from "../../console/console.component";
import { AiChatComponent } from "../../ai-chat/ai-chat.component";
import { PredicateManagerComponent } from "../predicate-manager/predicate-manager.component";

@Component({
  selector: "app-editor-bottommenu",
  imports: [
    Tabs,
    TabList,
    TabPanels,
    Tab,
    Button,
    TabPanel,
    ConsoleComponent,
    AiChatComponent,
    PredicateManagerComponent,
  ],
  templateUrl: "./editor-bottommenu.component.html",
  standalone: true,
  styleUrl: "./editor-bottommenu.component.css",
})
export class EditorBottommenuComponent {
  tabValue = signal(0);
  setTab(value: number): void {
    if (this.tabValue() == value) {
      this.tabValue.set(0);
    } else {
      this.tabValue.set(value);
    }
  }
}
