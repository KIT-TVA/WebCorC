import { TestBed } from '@angular/core/testing';

import { AiChatStorageService } from './ai-chat-storage.service';

describe('AiChatStorageService', () => {
  let service: AiChatStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiChatStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
