import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {KeycloakService} from './app/keycloak.service';

if (environment.production) {
  enableProdMode();
}
KeycloakService.init().subscribe(
  () => {
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.log(err));

  }, (err) => console.log(err)
);
