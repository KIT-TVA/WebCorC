import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorComponent } from './editor.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { SimpleStatementComponent } from './statements/simple-statement/simple-statement.component';
import { TreeService } from '../../services/tree/tree.service';
import { MatDialog } from '@angular/material/dialog';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let treeservice : TreeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [provideAnimations(), provideHttpClient()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;

    treeservice = fixture.debugElement.injector.get(TreeService);
    
    treeservice.rootNode = new SimpleStatementComponent(treeservice, fixture.debugElement.injector.get(MatDialog))
  
    fixture.autoDetectChanges()
  });

  it('should create', () => {
    setTimeout(() => { 
      expect(component).toBeTruthy(); 
    }, 100)
    
  });
});
