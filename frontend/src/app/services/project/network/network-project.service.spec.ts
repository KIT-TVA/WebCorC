import { TestBed } from '@angular/core/testing';

import { NetworkProjectService } from './network-project.service';
import { provideHttpClient } from '@angular/common/http';

describe('NetworkProjectService', () => {
  let service: NetworkProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(NetworkProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
