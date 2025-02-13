import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListPlacesComponent } from './pages/list-places/list-places.component';

const routes: Routes = [
    {
      path: 'saloon',
      component: ListPlacesComponent,
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlaceRoutingModule {}
