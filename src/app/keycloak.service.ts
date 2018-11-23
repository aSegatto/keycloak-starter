import {Injectable} from '@angular/core';
import * as Keycloak from 'keycloak-js';
import {Observable, ReplaySubject} from 'rxjs';

@Injectable()
export class KeycloakService {

  public static auth: any = {};

  public static init(): Observable<any> {
    let keycloakAuth: any = Keycloak('authentication/keycloak.json');
    let subject: ReplaySubject<any> = new ReplaySubject<any>(1);
    KeycloakService.auth.loggedIn = false;
    keycloakAuth.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
    }).success(() => {
      KeycloakService.auth.loggedIn = keycloakAuth.authenticated;
      KeycloakService.auth.authz = keycloakAuth;
      KeycloakService.auth.authz.onAuthRefreshError = () => KeycloakService.auth.authz.login();
      KeycloakService.auth.authz.onTokenExpired = () => console.log('token-expired');
      subject.next(keycloakAuth.authenticated);
    }).error(() => {
      subject.error('Failed to connect to keycloak');
    });
    return subject;
  }


  public logout(): void {
    let redirectUri: string = location.href;
    if (location.href.indexOf('#') !== -1) {
      redirectUri = redirectUri.substring(0, location.href.indexOf('#'));
    }
    let loginUrl: string = KeycloakService.auth.authz.createLoginUrl({redirectUri: redirectUri});
    KeycloakService.auth.authz.logout({redirectUri: redirectUri})
      .success(() => {
        KeycloakService.auth.loggedIn = false;
        KeycloakService.auth.authz = null;
      });
  }

  public login(): ReplaySubject<any> {
    let subject: ReplaySubject<any> = new ReplaySubject<any>(1);
    KeycloakService.auth.authz.login()
      .success(() => {
        subject.next(KeycloakService.auth.authz.authenticated);
      })
      .error(() => {
        subject.error('Failed to login');
      });
    return subject;
  }

  public editAccount(): ReplaySubject<any> {
    let subject: ReplaySubject<any> = new ReplaySubject<any>(1);
    KeycloakService.auth.authz.accountManagement()
      .success(() => {
        // empty
      })
      .error(() => {
        subject.error('Account management failed');
      });
    return subject;
  }

  public loadUserInfo(): Observable<KeycloakUser> {
    let subject: ReplaySubject<KeycloakUser> = new ReplaySubject<KeycloakUser>(1);
    if (KeycloakService.auth.loggedIn) {
      KeycloakService.auth.authz.loadUserInfo()
        .success((userInfo) => {
          subject.next(userInfo);
        })
        .error(() => {
          subject.error('Failed to Load user info');
        });
    } else {
      subject.error('User not logged In');
    }
    return subject;
  }

  public getToken(): Observable<string> {
    let subject: ReplaySubject<any> = new ReplaySubject<string>(1);
    if (KeycloakService.auth.authz.token) {
      KeycloakService.auth.authz.updateToken(15)
        .success(() => {
          subject.next(<string>KeycloakService.auth.authz.token);
        })
        .error(() => {
          let errorMessage: string = 'Failed to refresh token';
          subject.error(errorMessage);
          KeycloakService.auth.authz.clearToken();
          this.login();
        });
    } else {
      subject.next('');
    }
    return subject;
  }
}

export interface KeycloakUser {
  given_name: string;
  family_name: string;
  sub: string;
  email: string;
  preferred_username: string;
}
