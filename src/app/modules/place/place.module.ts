import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module'; 
import { PlaceRoutingModule } from './place-routing.module';
import { ListPlacesComponent } from './pages/list-places/list-places.component';
import { PlaceCardComponent } from './components/features/place-card/place-card.component';

@NgModule({
  declarations: [
    ListPlacesComponent,
    PlaceCardComponent
  ],
  imports: [CommonModule, PlaceRoutingModule, SharedModule],
})
export class PlaceModule {}
