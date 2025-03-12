import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
//import { LoginComponent } from './features/auth/login/login.component';
//import { RegisterComponent } from './features/auth/register/register.component';
import { WelcomePageComponent } from './features/home/pages/welcome-page/welcome-page.component';
import { ListSaloonPageComponent } from './features/saloon/pages/list-saloon-page/list-saloon-page.component';
import { RegisterPageComponent } from './features/auth/register/pages/register-page/register-page.component';
import { LoginPageComponent } from './features/auth/login/pages/login-page/login-page.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  //{path: 'login', component: LoginComponent},
  //{path: 'register', component: RegisterComponent},
  { path: 'welcome', component: WelcomePageComponent },
  { path: 'saloons', component: ListSaloonPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'login', component: LoginPageComponent },
];
