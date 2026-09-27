import { TestBed } from '@angular/core/testing';

import { IFbCVerificationResultHandlerService } from './network-confidentiality-job.service';

describe('ConfidentialityService', () => {
  let service: IFbCVerificationResultHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IFbCVerificationResultHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
