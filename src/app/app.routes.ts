import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  { path: 'home', loadChildren: () =>  import('./modules/home/home.module').then(m  => m.HomeModule) },
  { path: 'auth', loadChildren: () =>  import('./modules/auth/auth.module').then(m  => m.AuthModule) },
];
