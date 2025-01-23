import { TestBed } from '@angular/core/testing';

import { NetworkTreeService } from './network-tree.service';
import { provideHttpClient } from '@angular/common/http';

describe('NetworkTreeService', () => {
  let service: NetworkTreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers : [provideHttpClient()]});
    service = TestBed.inject(NetworkTreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
