import { TestBed } from '@angular/core/testing';

import { ProjectElementsMapperService } from './project-elements-mapper.service';

describe('ProjectElementsMapperService', () => {
  let service: ProjectElementsMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectElementsMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
