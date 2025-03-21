import { TestBed } from '@angular/core/testing';

import { AiChatNetworkService } from './ai-chat-network.service';
import { provideHttpClient } from '@angular/common/http';

describe('AiChatNetworkService', () => {
  let service: AiChatNetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers : [provideHttpClient()]});
    service = TestBed.inject(AiChatNetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
