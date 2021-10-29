import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Breakpoints {
  smScreenWidth: number;
  mdScreenWidth: number;
  lgScreenWidth: number;
  xlgScreenWidth: number;
}

@Injectable({ providedIn: 'root' })
export class NgScreenSizeBreakpointsService {
  config: Breakpoints = {
    smScreenWidth: 600,
    mdScreenWidth: 960,
    lgScreenWidth: 1280,
    xlgScreenWidth: 1920,
  };
  private http: HttpClient;

  constructor(
    httpHandler: HttpBackend,
  ) {
    this.http = new HttpClient(httpHandler);
  }

  load(sizeOverridesPath: string) {
    return new Promise<void>((resolve) => {
      if (sizeOverridesPath) {
        this.http.get(sizeOverridesPath, { responseType: 'text' }).pipe(
          catchError(() => of(''))
        ).subscribe((scss) => {
          if (scss) {
            Object.keys(this.config).forEach(key => {
              const value = new RegExp(`${key}:(.*)px`).exec(scss)?.[1].trim();
              this.config[key as keyof Breakpoints] = value && +value || this.config[key as keyof Breakpoints];
            });
          }
          resolve();
        })
      } else {
        resolve();
      }
    })
  }
}
