import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgScreenSizeBreakpointsService } from './ng-screen-size-breakpoints.service';

export type SizeName = 'xs' | 'sm' | 'md' | 'lg' | 'xlg' | '';

@Injectable({ providedIn: 'root' })
export class NgScreenSizeService {
  private sizes!: { name: SizeName, query: string }[];

  constructor(
    breakpoints: NgScreenSizeBreakpointsService,
    private observer: BreakpointObserver,
  ) {
    this.sizes = [
      { name: 'xs', query: `(max-width: ${breakpoints.config.smScreenWidth - 1}px)` },
      { name: 'sm', query: `(min-width: ${breakpoints.config.smScreenWidth}px) and (max-width: ${breakpoints.config.mdScreenWidth - 1}px)` },
      { name: 'md', query: `(min-width: ${breakpoints.config.mdScreenWidth}px) and (max-width: ${breakpoints.config.lgScreenWidth - 1}px)` },
      { name: 'lg', query: `(min-width: ${breakpoints.config.lgScreenWidth}px) and (max-width: ${breakpoints.config.xlgScreenWidth - 1}px)` },
      { name: 'xlg', query: `(min-width: ${breakpoints.config.xlgScreenWidth}px)` },
    ];
  }

  private getQueries = (sizes: SizeName | SizeName[]): string[] => {
    if (!Array.isArray(sizes)) {
      return [this.sizes.find((s) => s.name === sizes)?.query as string];
    }
    const ranges: { start: number, end: number }[] = [];
    sizes.forEach((size, i) => {
      if (size === '') {
        if (i === 0) {
          ranges.push({ start: 0, end: 0 });
        }
        if (i === sizes.length - 1) {
          ranges[ranges.length - 1].end = this.sizes.length - 1;
        } else {
          ranges[ranges.length - 1].end = 0;
        }
      } else {
        const sizeIndex = this.sizes.findIndex((s) => s.name === size);
        if (!ranges.length || ranges[ranges.length - 1].end) {
          ranges.push({ start: sizeIndex, end: sizeIndex });
        } else {
          ranges[ranges.length - 1].end = sizeIndex;
        }
      }
    });
    return ranges.reduce((queries, range) => queries.concat(
      ...this.sizes.slice(range.start, range.end + 1).map((s) => s.query),
    ), [] as string[]);
  };

  isSize(sizes: SizeName | SizeName[]): boolean {
    return this.observer.isMatched(this.getQueries(sizes));
  }

  watch(sizes: SizeName | SizeName[]): Observable<boolean> {
    return this.observer.observe(this.getQueries(sizes)).pipe(
      map((res) => res.matches),
    );
  }
}
