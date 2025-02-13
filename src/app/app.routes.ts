import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './general/welcome/welcome.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
  },
];
