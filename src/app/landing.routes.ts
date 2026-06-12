import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/home/pages/landing-page/landing-page.component';
import { ContactPageComponent } from './features/menu/pages/contact-page/contact-page.component';
import { LegalNoticesPageComponent } from './features/menu/pages/legal-notices-page/legal-notices-page.component';
import { TermsPageComponent } from './features/menu/pages/terms-page/terms-page.component';
import { PrivacyPolicyPageComponent } from './features/menu/pages/privacy-policy-page/privacy-policy-page.component';

export const landingRoutes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'mentions-legales', component: LegalNoticesPageComponent },
  { path: 'cgu', component: TermsPageComponent },
  { path: 'politique-confidentialite', component: PrivacyPolicyPageComponent },
  { path: '**', redirectTo: '' },
];
