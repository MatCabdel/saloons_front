import { Routes } from '@angular/router';
import { ListSaloonPageComponent } from './features/saloon/pages/list-saloon-page/list-saloon-page.component';
import { AuthPageComponent } from './features/auth/pages/auth-page/auth-page.component';
import { OnboardingPageComponent } from './features/auth/pages/onboarding-page/onboarding-page.component';
import { isLoggedInGuard } from './common/guards/is-logged-in.guard';
import { authGuard, onboardingGuard, profileCompleteGuard } from './core/guards/profile-complete.guard';
import { DashboardPageComponent } from './features/admin/pages/dashboard-page/dashboard-page.component';
import { ProfilPageComponent } from './features/profil/pages/profil-page/profil-page.component';
import { EditProfilPageComponent } from './features/profil/pages/edit-profil-page/edit-profil-page.component';
import { MessagesPageComponent } from './features/messages/pages/messages-page/messages-page.component';
import { MySaloonPageComponent } from './features/saloon/pages/my-saloon-page/my-saloon-page.component';
import { MapSaloonPageComponent } from './features/saloon/pages/map-saloon-page/map-saloon-page.component';
import { ProfilVisitorPageComponent } from './features/profil/pages/profil-visitor-page/profil-visitor-page.component';
import { MatchPageComponent } from './features/match/pages/match-page/match-page.component';
import { HeartConfirmedPageComponent } from './features/match/pages/heart-confirmed-page/heart-confirmed-page.component';
import { ConversationsPageComponent } from './features/conversation/pages/conversations-page/conversations-page.component';
import { StatisticsPageComponent } from './features/admin/pages/statistics-page/statistics-page.component';
import { UsersListPageComponent } from './features/admin/pages/users-list-page/users-list-page.component';
import { SaloonSwitcherPageComponent } from './features/saloon/pages/saloon-switcher-page/saloon-switcher-page.component';
import { CreateSaloonPageComponent } from './features/admin/pages/create-saloon-page/create-saloon-page.component';
import { EditSaloonPageComponent } from './features/admin/pages/edit-saloon-page/edit-saloon-page.component';
import { SaloonsListPageComponent } from './features/admin/pages/saloons-list-page/saloons-list-page.component';
import { CityStatsPageComponent } from './features/admin/pages/city-stats-page/city-stats-page.component';
import { SaloonsStatsPageComponent } from './features/admin/pages/saloons-stats-page/saloons-stats-page.component';
import { ReportsListPageComponent } from './features/admin/pages/reports-list-page/reports-list-page.component';
import { SaloonChatPageComponent } from './features/saloon/pages/saloon-chat-page/saloon-chat-page.component';
import { UnauthorizedPageComponent } from './features/auth/pages/unauthorized-page/unauthorized-page.component';
import { MonComptePageComponent } from './features/menu/pages/mon-compte-page/mon-compte-page.component';
import { ChangePasswordPageComponent } from './features/menu/pages/change-password-page/change-password-page.component';
import { DeleteAccountPageComponent } from './features/menu/pages/delete-account-page/delete-account-page.component';
import { SaloonDemandePageComponent } from './features/menu/pages/saloon-demande-page/saloon-demande-page.component';
import { FaqPageComponent } from './features/menu/pages/faq-page/faq-page.component';
import { ContactPageComponent } from './features/menu/pages/contact-page/contact-page.component';

export const routes: Routes = [
  // Page d'accueil = inscription
  { path: '', component: AuthPageComponent, canActivate: [authGuard] },
  // Page de connexion
  { path: 'login', component: AuthPageComponent, canActivate: [authGuard] },
  // Onboarding après inscription
  { path: 'onboarding', component: OnboardingPageComponent, canActivate: [onboardingGuard] },
  {
    path: 'saloons',
    component: SaloonSwitcherPageComponent,
    canActivate: [isLoggedInGuard, profileCompleteGuard],
    children: [
      { path: '', component: ListSaloonPageComponent },
      { path: 'map', component: MapSaloonPageComponent },
    ],
  },
  { path: 'map', redirectTo: 'saloons/map', pathMatch: 'full' },
  // Legacy routes
  { path: 'register', redirectTo: '', pathMatch: 'full' },
  { path: 'auth', redirectTo: '', pathMatch: 'full' },
  { path: 'profil', component: ProfilPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'profil/edit', component: EditProfilPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'chat', component: ConversationsPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'mysaloon/:id', component: MySaloonPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'saloon-chat/:saloonId', component: SaloonChatPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'profil-visitor/:id', component: ProfilVisitorPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'match/:userId1/:userId2', component: MatchPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'heart-confirmed/:userId1/:userId2', component: HeartConfirmedPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'messages/:conversationId', component: MessagesPageComponent, canActivate: [isLoggedInGuard] },
  // Menu pages
  { path: 'mon-compte', component: MonComptePageComponent, canActivate: [isLoggedInGuard] },
  { path: 'mon-compte/changer-mot-de-passe', component: ChangePasswordPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'mon-compte/supprimer-compte', component: DeleteAccountPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'saloon-demande', component: SaloonDemandePageComponent, canActivate: [isLoggedInGuard] },
  { path: 'faq', component: FaqPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'contact', component: ContactPageComponent, canActivate: [isLoggedInGuard] },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    children: [
      { path: 'statistics', component: StatisticsPageComponent },
      { path: 'city-stats', component: CityStatsPageComponent },
      { path: 'saloons-stats', component: SaloonsStatsPageComponent },
      { path: 'users-list', component: UsersListPageComponent },
      { path: 'saloons-list', component: SaloonsListPageComponent },
      { path: 'create-saloon', component: CreateSaloonPageComponent },
      { path: 'edit-saloon/:id', component: EditSaloonPageComponent },
      { path: 'reports-list', component: ReportsListPageComponent },
      { path: '', redirectTo: 'statistics', pathMatch: 'full' },
    ],
    canActivate: [isLoggedInGuard],
  },
  // Page d'erreur pour les utilisateurs non autorisés / compte supprimé
  { path: 'unauthorized', component: UnauthorizedPageComponent },
  { path: '**', redirectTo: '' },
];
