import { TestBed } from '@angular/core/testing';

import { VerifierNetworkService } from './verifier-network.service';
import { provideHttpClient } from '@angular/common/http';

describe('VerifierNetworkService', () => {
  let service: VerifierNetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(VerifierNetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
