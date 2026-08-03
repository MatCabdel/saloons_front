import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/home/pages/landing-page/landing-page.component';
import { ContactPageComponent } from './features/menu/pages/contact-page/contact-page.component';
import { LegalNoticesPageComponent } from './features/menu/pages/legal-notices-page/legal-notices-page.component';
import { TermsPageComponent } from './features/menu/pages/terms-page/terms-page.component';
import { PrivacyPolicyPageComponent } from './features/menu/pages/privacy-policy-page/privacy-policy-page.component';
import { PublicDeleteAccountPageComponent } from './features/menu/pages/public-delete-account-page/public-delete-account-page.component';
import { MinorProtectionPageComponent } from './features/menu/pages/minor-protection-page/minor-protection-page.component';
import { DownloadPageComponent } from './features/home/pages/download-page/download-page.component';

export const landingRoutes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'download', component: DownloadPageComponent },
  { path: 'telecharger', redirectTo: 'download', pathMatch: 'full' },
  { path: 'contact', component: ContactPageComponent, data: { publicHeader: true } },
  { path: 'mentions-legales', component: LegalNoticesPageComponent },
  { path: 'cgu', component: TermsPageComponent },
  { path: 'politique-confidentialite', component: PrivacyPolicyPageComponent },
  { path: 'suppression-compte', component: PublicDeleteAccountPageComponent },
  { path: 'protection-des-mineurs', component: MinorProtectionPageComponent },
  { path: '**', redirectTo: '' },
];
