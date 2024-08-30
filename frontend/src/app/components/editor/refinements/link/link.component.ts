import {AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {CdkDragEnd} from "@angular/cdk/drag-drop";
import {ReplaySubject} from "rxjs";
import { TreeService } from '../../../../services/tree/tree.service';

@Component({
  selector: 'refinement-link',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <mat-icon #linkIcon>link</mat-icon>
  `,
  styles: `
    @import "../../../../../styles";
    mat-icon {
      padding-left: $refinementBodyPadding;
      padding-right: $refinementBodyPadding;
    }
  `
})
export class LinkComponent implements AfterViewInit, OnDestroy {
  @Input() linkedRefinement!: ElementRef;
  @Input() onSubRefinementDragMove!: ReplaySubject<void>;
  @Input() onSubRefinementDragEnd!: ReplaySubject<CdkDragEnd>;
  @Input() onOriginRefinementDragMove!: ReplaySubject<void>;
  @Input() onOriginRefinementDragEnd!: ReplaySubject<CdkDragEnd>;
  @Input() scrollNotifier!: ReplaySubject<void>;

  @ViewChild("linkIcon") linkIcon!: MatIcon;

  private lineContainerDOM!: HTMLDivElement;

  constructor(private treeService : TreeService) {}


  ngAfterViewInit(): void {
    this.createLineDOM();

    this.onOriginRefinementDragMove.subscribe(() => this.drawLine());
    this.onSubRefinementDragMove.subscribe(() => this.drawLine());

    this.scrollNotifier.subscribe(() => this.drawLine());
    this.treeService.deletionNotifier.subscribe(() => this.redrawBackground())

    this.drawLine();
  }

  ngOnDestroy() {
    this.lineContainerDOM!.remove();
  }

  createLineDOM(): void {
    const lineSpawn = document.getElementById("lineSpawn");
    if (lineSpawn) {
      const lineContainer = document.createElement("div");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("stroke", "black");
      line.setAttribute("stroke-width", "2");
      svg.append(line);

      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      lineContainer.appendChild(svg);

      lineContainer.style.position = "absolute";
      lineContainer.style.zIndex = "-2";
      lineSpawn.appendChild(lineContainer);
      this.lineContainerDOM = lineContainer;
    }
  }

  drawLine(): void {
    const refinementBoundaries = this.linkedRefinement.nativeElement.children[0].children[0].getBoundingClientRect();
    const iconBoundaries = this.linkIcon._elementRef.nativeElement.getBoundingClientRect();

    const linkLine = this.lineContainerDOM.children[0].children[0];

    const refinementCenterX = refinementBoundaries.x + refinementBoundaries.width/2;
    const iconCenterX = iconBoundaries.x + iconBoundaries.width/2;
    const iconCenterY = iconBoundaries.y + iconBoundaries.height/2 - 64;
    if (linkLine) {
      const svgWidth = Math.max(1, Math.abs(refinementCenterX-iconCenterX));
      const svgHeight = Math.max(1, Math.abs(refinementBoundaries.y - iconCenterY));
      this.lineContainerDOM!.style.top = Math.min(refinementBoundaries.y, iconCenterY) + "px";
      this.lineContainerDOM!.style.left = Math.min(refinementCenterX, iconCenterX) + "px";
      this.lineContainerDOM!.style.width = svgWidth + "px";
      this.lineContainerDOM!.style.height = svgHeight + "px";

      if ((refinementCenterX < iconCenterX && refinementBoundaries.y >= iconCenterY) ||
        (refinementCenterX >= iconCenterX && refinementBoundaries.y < iconCenterY)) {
        linkLine.setAttribute("x1", "0");
        linkLine.setAttribute("y1", svgHeight.toString());
        linkLine.setAttribute("x2", svgWidth.toString());
        linkLine.setAttribute("y2", "0");
      } else {
        linkLine.setAttribute("x1", "0");
        linkLine.setAttribute("y1", "0");
        linkLine.setAttribute("x2", svgWidth.toString());
        linkLine.setAttribute("y2", svgHeight.toString());
      }
    }
  }

  redrawBackground() : void {
    this.lineContainerDOM.childNodes.forEach((child) => {
      this.lineContainerDOM.removeChild(child)
    });
    this.createLineDOM()
    this.drawLine()
  }
}
