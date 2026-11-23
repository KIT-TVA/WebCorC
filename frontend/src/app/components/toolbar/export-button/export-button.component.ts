import { Component, OnInit } from "@angular/core";
import { NetworkJobService } from "../../../services/tree/network/network-job.service";
import { MenuItem } from "@openng/optimus-ui/api";
import { SplitButtonModule } from "@openng/optimus-ui/splitbutton";
import { TreeService } from "../../../services/tree/tree.service";
import { finalize } from "rxjs";

export type ExportType = 'pdf' |'drawio' | 'png';

@Component({
  selector: "app-export-button",
  standalone: true,
  imports: [SplitButtonModule],
  templateUrl: "./export-button.component.html",
  styleUrl: "./export-button.component.css"
})
export class ExportButtonComponent implements OnInit {
  exportItems: MenuItem[] = [];
  isExporting = false;

  constructor(
    private networkTreeService: NetworkJobService,
    public treeService : TreeService
  ) {}

  ngOnInit(): void {
    this.exportItems = [
      {
        label: 'Export as PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.export('pdf')
      },
      {
        label: 'Export as PNG',
        icon: 'pi pi-image',
        command: () => this.export('png')
      },
      {
        label: 'Export as draw.io',
        icon: 'pi pi-file-pdf',
        command: () => this.export('drawio')
      }
    ];
  }

  public export(type: ExportType): void {
    if (this.isExporting) return;

    this.isExporting = true;

    this.networkTreeService.export(type)
      .pipe(finalize(() => this.isExporting = false))
      .subscribe();
  }
}