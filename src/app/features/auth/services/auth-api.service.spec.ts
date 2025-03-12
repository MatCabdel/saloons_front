import { TestBed } from '@angular/core/testing';

import { AuthApiService } from './auth-api.service';
import { provideHttpClient } from '@angular/common/http';

describe('AuthApiService', () => {
  let service: AuthApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      AuthApiService,
      provideHttpClient()
    ]});
    service = TestBed.inject(AuthApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
