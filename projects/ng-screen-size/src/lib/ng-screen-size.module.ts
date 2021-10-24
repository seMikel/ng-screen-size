import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, InjectionToken, NgModule } from '@angular/core';
import { NgScreenSizeBreakpointsService } from './ng-screen-size-breakpoints.service';
import { NgScreenSizeDirective } from './ng-screen-size.directive';

export const ScreenSizeBreakpointVariables = new InjectionToken<string>('BreakpointVariables', {
  providedIn: 'root',
  factory: () => '',
});

const readConfig = (service: NgScreenSizeBreakpointsService, sizeOverridesPath: string) => () => service.load(sizeOverridesPath);

@NgModule({
  declarations: [
    NgScreenSizeDirective
  ],
  imports: [
    HttpClientModule,
  ],
  exports: [
    NgScreenSizeDirective
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: readConfig, multi: true, deps: [NgScreenSizeBreakpointsService, ScreenSizeBreakpointVariables] },
  ]
})
export class NgScreenSizeModule { }
