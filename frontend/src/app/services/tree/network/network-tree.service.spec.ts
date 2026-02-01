import { TestBed } from "@angular/core/testing";

import { NetworkJobService } from "./network-job.service";
import { provideHttpClient } from "@angular/common/http";

describe("NetworkTreeService", () => {
  let service: NetworkJobService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(NetworkJobService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
