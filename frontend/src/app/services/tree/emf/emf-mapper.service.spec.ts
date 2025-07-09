import { TestBed } from '@angular/core/testing';

import { EmfMapperService } from './emf-mapper.service';

describe('EmfService', () => {
  let service: EmfMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmfMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
