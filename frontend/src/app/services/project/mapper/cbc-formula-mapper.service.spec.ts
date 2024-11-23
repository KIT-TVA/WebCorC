import { TestBed } from '@angular/core/testing';

import { CbcFormulaMapperService } from './cbc-formula-mapper.service';

describe('CbcFormulaMapperService', () => {
  let service: CbcFormulaMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CbcFormulaMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
