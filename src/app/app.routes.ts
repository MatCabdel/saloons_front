import { Routes } from '@angular/router';
import { ListSaloonPageComponent } from './features/saloon/pages/list-saloon-page/list-saloon-page.component';
import { AuthPageComponent } from './features/auth/pages/auth-page/auth-page.component';
import { OnboardingPageComponent } from './features/auth/pages/onboarding-page/onboarding-page.component';
import { isLoggedInGuard } from './common/guards/is-logged-in.guard';
import {
  authGuard,
  onboardingGuard,
  profileCompleteGuard,
} from './core/guards/profile-complete.guard';
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
import { UserCityStatsPageComponent } from './features/admin/pages/user-city-stats-page/user-city-stats-page.component';
import { ReportsListPageComponent } from './features/admin/pages/reports-list-page/reports-list-page.component';
import { OverviewStatsPageComponent } from './features/admin/pages/overview-stats-page/overview-stats-page.component';
import { GrowthStatsPageComponent } from './features/admin/pages/growth-stats-page/growth-stats-page.component';
import { SaloonEngagementStatsPageComponent } from './features/admin/pages/saloon-engagement-stats-page/saloon-engagement-stats-page.component';
import { MatchChatStatsPageComponent } from './features/admin/pages/match-chat-stats-page/match-chat-stats-page.component';
import { PremiumStatsPageComponent } from './features/admin/pages/premium-stats-page/premium-stats-page.component';
import { GeographyStatsPageComponent } from './features/admin/pages/geography-stats-page/geography-stats-page.component';
import { SaloonChatPageComponent } from './features/saloon/pages/saloon-chat-page/saloon-chat-page.component';
import { UnauthorizedPageComponent } from './features/auth/pages/unauthorized-page/unauthorized-page.component';
import { MonComptePageComponent } from './features/menu/pages/mon-compte-page/mon-compte-page.component';
import { ChangePasswordPageComponent } from './features/menu/pages/change-password-page/change-password-page.component';
import { DeleteAccountPageComponent } from './features/menu/pages/delete-account-page/delete-account-page.component';
import { SaloonDemandePageComponent } from './features/menu/pages/saloon-demande-page/saloon-demande-page.component';
import { FaqPageComponent } from './features/menu/pages/faq-page/faq-page.component';
import { ContactPageComponent } from './features/menu/pages/contact-page/contact-page.component';
import { ForgotPasswordPageComponent } from './features/auth/pages/forgot-password-page/forgot-password-page.component';
import { LegalNoticesPageComponent } from './features/menu/pages/legal-notices-page/legal-notices-page.component';
import { TermsPageComponent } from './features/menu/pages/terms-page/terms-page.component';
import { PrivacyPolicyPageComponent } from './features/menu/pages/privacy-policy-page/privacy-policy-page.component';
import { PublicDeleteAccountPageComponent } from './features/menu/pages/public-delete-account-page/public-delete-account-page.component';
import { WelcomePageComponent } from './features/home/pages/welcome-page/welcome-page.component';
import { LandingPageComponent } from './features/home/pages/landing-page/landing-page.component';
import { EventSwitcherPageComponent } from './features/event/pages/event-switcher-page/event-switcher-page.component';
import { EventsPageComponent } from './features/event/pages/events-page/events-page.component';
import { CreateEventPageComponent } from './features/admin/pages/create-event-page/create-event-page.component';
import { EditEventPageComponent } from './features/admin/pages/edit-event-page/edit-event-page.component';
import { EventsListPageComponent } from './features/admin/pages/events-list-page/events-list-page.component';

export const routes: Routes = [
  // Splash screen au lancement
  { path: '', component: WelcomePageComponent },
  // Landing page publique
  { path: 'home', component: LandingPageComponent },
  // Page d'accueil auth
  { path: 'auth', component: AuthPageComponent, canActivate: [authGuard] },
  // Page de connexion
  { path: 'login', component: AuthPageComponent, canActivate: [authGuard] },
  { path: 'mot-de-passe-oublie', component: ForgotPasswordPageComponent, canActivate: [authGuard] },
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
  {
    path: 'events',
    component: EventSwitcherPageComponent,
    canActivate: [isLoggedInGuard, profileCompleteGuard],
    children: [{ path: '', component: EventsPageComponent }],
  },
  { path: 'map', redirectTo: 'saloons/map', pathMatch: 'full' },
  // Legacy routes
  { path: 'register', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'profil', component: ProfilPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'profil/edit', component: EditProfilPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'chat', component: ConversationsPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'mysaloon/:id', component: MySaloonPageComponent, canActivate: [isLoggedInGuard] },
  {
    path: 'saloon-chat/:saloonId',
    component: SaloonChatPageComponent,
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'profil-visitor/:id',
    component: ProfilVisitorPageComponent,
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'match/:userId1/:userId2',
    component: MatchPageComponent,
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'heart-confirmed/:userId1/:userId2',
    component: HeartConfirmedPageComponent,
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'messages/match/:matchUserId',
    component: MessagesPageComponent,
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'messages/:conversationId',
    component: MessagesPageComponent,
    canActivate: [isLoggedInGuard],
  },
  // Menu pages
  { path: 'mon-compte', component: MonComptePageComponent, canActivate: [isLoggedInGuard] },
  {
    path: 'mon-compte/changer-mot-de-passe',
    component: ChangePasswordPageComponent,
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'mon-compte/supprimer-compte',
    component: DeleteAccountPageComponent,
    canActivate: [isLoggedInGuard],
  },
  { path: 'saloon-demande', component: SaloonDemandePageComponent, canActivate: [isLoggedInGuard] },
  { path: 'faq', component: FaqPageComponent, canActivate: [isLoggedInGuard] },
  { path: 'contact', component: ContactPageComponent },
  {
    path: 'mentions-legales',
    component: LegalNoticesPageComponent,
  },
  {
    path: 'cgu',
    component: TermsPageComponent,
  },
  {
    path: 'politique-confidentialite',
    component: PrivacyPolicyPageComponent,
  },
  {
    path: 'suppression-compte',
    component: PublicDeleteAccountPageComponent,
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    children: [
      { path: 'overview', component: OverviewStatsPageComponent },
      { path: 'growth', component: GrowthStatsPageComponent },
      { path: 'saloon-engagement', component: SaloonEngagementStatsPageComponent },
      { path: 'match-chat', component: MatchChatStatsPageComponent },
      { path: 'premium', component: PremiumStatsPageComponent },
      { path: 'geography', component: GeographyStatsPageComponent },
      { path: 'statistics', component: StatisticsPageComponent },
      { path: 'city-stats', component: CityStatsPageComponent },
      { path: 'saloons-stats', component: SaloonsStatsPageComponent },
      { path: 'user-city-stats', component: UserCityStatsPageComponent },
      { path: 'users-list', component: UsersListPageComponent },
      { path: 'saloons-list', component: SaloonsListPageComponent },
      { path: 'create-saloon', component: CreateSaloonPageComponent },
      { path: 'edit-saloon/:id', component: EditSaloonPageComponent },
      { path: 'reports-list', component: ReportsListPageComponent },
      { path: 'create-event', component: CreateEventPageComponent },
      { path: 'events-list', component: EventsListPageComponent },
      { path: 'edit-event/:id', component: EditEventPageComponent },
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ],
    canActivate: [isLoggedInGuard],
  },
  // Page d'erreur pour les utilisateurs non autorisés / compte supprimé
  { path: 'unauthorized', component: UnauthorizedPageComponent },
  { path: '**', redirectTo: '' },
];
