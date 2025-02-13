import { WelcomeComponent } from './welcome.component';
import { mount } from 'cypress/angular';

describe('WelcomeComponent', () => {
  it('should mount', () => {
    mount(WelcomeComponent);
  });
});
