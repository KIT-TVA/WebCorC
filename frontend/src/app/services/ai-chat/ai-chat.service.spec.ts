import { TestBed } from '@angular/core/testing';

import { AiChatService } from './ai-chat.service';
import { provideHttpClient } from '@angular/common/http';

describe('AiChatService', () => {
  let service: AiChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers : [provideHttpClient()]});
    service = TestBed.inject(AiChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
