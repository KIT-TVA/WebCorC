import { TestBed } from "@angular/core/testing";

import { PredicateService } from "./predicate.service";

describe("PredicateServiceService", () => {
  let service: PredicateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PredicateService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
