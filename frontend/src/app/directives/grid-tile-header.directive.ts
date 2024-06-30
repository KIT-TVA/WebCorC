import {Directive, ElementRef} from '@angular/core';
import {GridTileBorderDirective} from "./grid-tile-border.directive";

@Directive({
  selector: '[gridTileHeader]',
  standalone: true
})
export class GridTileHeaderDirective {
  constructor(private ref: ElementRef) {
    ref.nativeElement.style.backgroundColor = "white";
    ref.nativeElement.style.color = "black";
    ref.nativeElement.style.borderBottom = GridTileBorderDirective.BORDER_STYLE;
  }
}
