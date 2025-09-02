import { Routes } from '@angular/router';
import { WelcomePageComponent } from './features/home/pages/welcome-page/welcome-page.component';
import { ListSaloonPageComponent } from './features/saloon/pages/list-saloon-page/list-saloon-page.component';
import { RegisterPageComponent } from './features/auth/register/pages/register-page/register-page.component';
import { LoginPageComponent } from './features/auth/login/pages/login-page/login-page.component';
import { isLoggedInGuard } from './common/guards/is-logged-in.guard';
import { DashboardPageComponent } from './features/admin/pages/dashboard-page/dashboard-page.component';
import { QrcodePageComponent } from './features/qrcode/pages/qrcode-page/qrcode-page.component';
import { ProfilPageComponent } from './features/profil/pages/profil-page/profil-page.component';
import { MessagesPageComponent } from './features/messages/pages/messages-page/messages-page.component';
import { MySaloonPageComponent } from './features/saloon/pages/my-saloon-page/my-saloon-page.component';
import { MapSaloonPageComponent } from './features/saloon/pages/map-saloon-page/map-saloon-page.component';
import { ProfilVisitorPageComponent } from './features/profil/pages/profil-visitor-page/profil-visitor-page.component';
import { MatchPageComponent } from './features/match/pages/match-page/match-page.component';
import { ConversationsPageComponent } from './features/conversation/pages/conversations-page/conversations-page.component';

export const routes: Routes = [
  { path: '', component: WelcomePageComponent },
  { path: 'saloons', component: ListSaloonPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'map', component: MapSaloonPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'register', component: RegisterPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'scan', component: QrcodePageComponent, canActivate: [isLoggedInGuard] },
  { path: 'profil', component: ProfilPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'chat', component: ConversationsPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'mysaloon/:id', component: MySaloonPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'profil-visitor/:id', component: ProfilVisitorPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'match/:userId1/:userId2', component: MatchPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'messages/:conversationId', component: MessagesPageComponent, canActivate: [isLoggedInGuard] },
  { path: '**', redirectTo: '' },
];
