import { TestBed } from '@angular/core/testing';

import { NetworkTreeService } from './network-tree.service';

describe('NetworkTreeService', () => {
  let service: NetworkTreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkTreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
