import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapSaloonPageComponent } from './map-saloon-page.component';

describe('MapSaloonPageComponent', () => {
  let component: MapSaloonPageComponent;
  let fixture: ComponentFixture<MapSaloonPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSaloonPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapSaloonPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
