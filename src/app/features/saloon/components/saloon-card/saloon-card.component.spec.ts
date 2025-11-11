import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaloonCardComponent } from './saloon-card.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';

describe('SaloonCardComponent (integration)', () => {
  let fixture: ComponentFixture<SaloonCardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaloonCardComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SaloonCardComponent);
    httpMock = TestBed.inject(HttpTestingController);

    fixture.componentInstance.saloon = { id: 1, name: 'Test Saloon', imgUrl: 'test.jpg', address: 'Test Address', visitors: 5 };
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('affiche le nombre de visiteurs récupéré via API', () => {
    const req = httpMock.expectOne(`${environment.apiUrl}/saloon/1/users`);
    req.flush([{ id: 10 }, { id: 11 }]); 

    fixture.detectChanges();
    const visitors = fixture.nativeElement.querySelector('p').textContent;
    expect(visitors).toContain('2 visiteurs');
  });
});