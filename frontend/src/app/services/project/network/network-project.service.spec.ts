import { TestBed } from '@angular/core/testing';

import { NetworkProjectService } from './network-project.service';

describe('NetworkProjectService', () => {
  let service: NetworkProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
