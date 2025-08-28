import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment.development';
import { SaloonApiService } from './saloon-api.service';
import { Saloon } from '../models/saloonModel';


describe('SaloonApiService', () => {
  let service: SaloonApiService;
  let httpMock: HttpTestingController;
  const _apiUrl = environment.apiUrl;
  
  const mockSaloons: Saloon[] = [
    { id: 1, name: 'Saloon 1', imgUrl: "pic.jpeg", address: 'Description 1', visitors: 3 },
    { id: 2, name: 'Saloon 2', imgUrl: "pic2.jpeg", address: 'Description 2', visitors: 4 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SaloonApiService]
    });
    
    service = TestBed.inject(SaloonApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getListSaloon', () => {
    it('should return list of saloons', () => {
      service.getListSaloon().subscribe(saloons => {
        expect(saloons).toEqual(mockSaloons);
        expect(saloons.length).toBe(2);
      });

      const req = httpMock.expectOne(`${_apiUrl}/saloon`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockSaloons);
    });

    it('should handle empty saloon list', () => {
      service.getListSaloon().subscribe(saloons => {
        expect(saloons).toEqual([]);
        expect(saloons.length).toBe(0);
      });

      const req = httpMock.expectOne(`${_apiUrl}/saloon`);
      req.flush([]);
    });

    it('should handle HTTP errors', () => {
      service.getListSaloon().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${_apiUrl}/saloon`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should call correct API endpoint', () => {
      service.getListSaloon().subscribe();

      const req = httpMock.expectOne(`${_apiUrl}/saloon`);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`${_apiUrl}/saloon`);
      
      req.flush(mockSaloons);
    });
  });
});