import { TestBed } from '@angular/core/testing';

import { ProjectService } from './project.service';
import { provideHttpClient } from '@angular/common/http';

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient()]});
    service = TestBed.inject(ProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
