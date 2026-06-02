import { bootstrapApplication } from '@angular/platform-browser';
import { landingAppConfig } from './app/landing-app.config';
import { LandingAppComponent } from './app/landing-app.component';
import { verifyEnvironment } from './environments/verify-environment';

verifyEnvironment();
bootstrapApplication(LandingAppComponent, landingAppConfig).catch(err =>
  console.error('Failed to bootstrap landing application:', err)
);
