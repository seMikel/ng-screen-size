import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgScreenSizeService, SizeName } from './ng-screen-size.service';

@Directive({
  selector: '[ngScreenSize]',
})
export class NgScreenSizeDirective {
  private subscription = new Subscription();

  @Input('ngScreenSize') set size(value: SizeName | SizeName[]) {
    this.subscription.unsubscribe();
    this.subscription = this.service.watch(value).subscribe(this.updateView);
  }

  constructor(
    private service: NgScreenSizeService,
    private vcRef: ViewContainerRef,
    private templateRef: TemplateRef<unknown>,
  ) { }

  updateView = (matches: boolean): void => {
    if (matches && !this.vcRef.length) {
      this.vcRef.createEmbeddedView(this.templateRef);
    } else if (!matches && this.vcRef.length) {
      this.vcRef.clear();
    }
  };

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
