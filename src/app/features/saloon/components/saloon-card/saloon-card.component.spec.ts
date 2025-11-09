import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaloonCardComponent } from './saloon-card.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SaloonApiService } from '../../services/saloon-api.service';

describe('SaloonCardComponent (integration)', () => {
  let component: SaloonCardComponent;
  let fixture: ComponentFixture<SaloonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaloonCardComponent, HttpClientTestingModule],
      providers: [SaloonApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(SaloonCardComponent);
    component = fixture.componentInstance;
    component.saloon = {
      id: 1,
      name: 'Test Saloon',
      imgUrl: 'test.jpg',
      address: 'Test Address',
      visitors: 5
    };
    fixture.detectChanges();
  });

  it('affiche le nom du saloon dans le template', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Test Saloon');
  });
});