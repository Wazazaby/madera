import { Injectable, OnDestroy } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { NbAuthService, NbAuthToken } from '@nebular/auth';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatesService } from './states.service';

@Injectable({
  providedIn: 'root',
})
export class InterceptorService implements HttpInterceptor, OnDestroy {

  private token: string = this._stateService.token;
  private request: HttpRequest<any>;


  /** Subject utilisé pour le unsubscribe de tout les obs */
  private destroyed = new Subject();

  constructor(private _authService: NbAuthService,
              private _stateService: StatesService) {
    // Récup le token
    this._authService.getToken()
      .pipe(takeUntil(this.destroyed))
      .subscribe((token: NbAuthToken) => {
      if (token) {
        this.token = token.toString();
        this._stateService.token = this.token;
      }
    });

    // Récup le token
    this._stateService.tokenAsObservable().subscribe((token) => {
      if (token) {
        this.token = token;
      }
    });
  }

  /**
   * Récupère les requêtes vers l'API pour ajouter le token dans le header
   */
  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.token) {
      this.request = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + this.token),
      });
    } else {
      this.request = req;
    }
    return next.handle(this.request);
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

}
