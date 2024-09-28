import {Directive, ElementRef, Input} from '@angular/core';

@Directive({
  selector: '[appGtBorder]',
  standalone: true
})
export class GridTileBorderDirective {
  public static readonly BORDER_STYLE = "1px solid rgb(173, 173, 173)";

  constructor(private ref: ElementRef) {
    ref.nativeElement.classList.add("conditionTileWidth");
  }

  @Input() set appGtBorder(borders: string) {
    if (borders) {
      if (borders.includes("r")) {
        this.ref.nativeElement.style.borderRight = GridTileBorderDirective.BORDER_STYLE;
      }
      if (borders.includes("l")) {
        this.ref.nativeElement.style.borderLeft = GridTileBorderDirective.BORDER_STYLE;
      }
      if (borders.includes("t")) {
        this.ref.nativeElement.style.borderTop = GridTileBorderDirective.BORDER_STYLE;
      }
    }
  }
}
