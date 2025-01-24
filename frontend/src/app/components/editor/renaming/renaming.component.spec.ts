import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenamingComponent } from './renaming.component';

describe('RenamingComponent', () => {
  let component: RenamingComponent;
  let fixture: ComponentFixture<RenamingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenamingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenamingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
