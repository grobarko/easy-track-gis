import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { NewFeature } from './arc-gis-map/new-feature.model';

@Injectable({
  providedIn: 'root'
})
export class EasyTrackFeatureService {

  private featureUrl: string = "https://services2.arcgis.com/MqHf9wrWjblgLZWc/arcgis/rest/services/easytrack/FeatureServer";
  private authUrl: string = "https://www.arcgis.com/sharing/rest/oauth2/token";

  constructor(private http: HttpClient) { }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const expires = localStorage.getItem('expires');
    if (!expires) {
      localStorage.removeItem('token');
      return false;
    }

    const expiresDate = new Date(expires);
    if (!expiresDate || expiresDate < new Date()) {
      localStorage.clear();
      return false;
    }

    return true;
  }

  getToken(): string {
    return localStorage.getItem("token");
  }

  getExpires(): Date {
    return new Date(localStorage.getItem('expires'));
  }

  generateToken(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      })
    }

    const body = `client_id=dsOX1lsDipaUeFHf&client_secret=72aa9109601049e1b1d96172860c2cb3&grant_type=client_credentials&expiration=20160`;

    return this.http.post(`${this.authUrl}`, body, httpOptions)
      .pipe(
        tap(
          (data: any) => {
            localStorage.setItem('token', data.access_token);

            const now = new Date();
            now.setTime(now.getTime() + (data.expires_in * 1000));
            localStorage.setItem('expires', now.toISOString());
          }
        ),
        catchError(this.handleError)
      );
  }

  addFeatures (features: NewFeature[]): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      })
    }

    const body = `f=json&token=${this.getToken()}&adds=${JSON.stringify(features)}`;

    return this.http.post(`${this.featureUrl}/0/applyEdits`, body, httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getLastPosition(): any {
    const lastPosition = localStorage.getItem('position');
    if (!!lastPosition) {
      return JSON.parse(lastPosition);
    }
    return null;
  }

  getPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resp => {
        localStorage.setItem('position', JSON.stringify({latitude: resp.coords.latitude, longitude: resp.coords.longitude}));
          resolve(resp.coords);
        },
        err => {
          reject(err);
        });
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.log('handle error');
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  }
}
