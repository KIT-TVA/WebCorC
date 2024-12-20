import { TestBed } from '@angular/core/testing';

import { ProjectStorageService } from './project-storage.service';

describe('ProjectStorageService', () => {
  let service: ProjectStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
