import { TestBed } from '@angular/core/testing';

import { AiChatNetworkService } from './ai-chat-network.service';

describe('AiChatNetworkService', () => {
  let service: AiChatNetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiChatNetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
