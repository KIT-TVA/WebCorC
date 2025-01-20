import { TestBed } from '@angular/core/testing';

import { NetworkTreeService } from './network-tree.service';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { EmfMapperService } from '../emf/emf-mapper.service';
import { NetworkStatusService } from '../../networkStatus/network-status.service';
import { ConsoleService } from '../../console/console.service';

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
