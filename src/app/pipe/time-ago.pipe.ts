import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false // This allows the pipe to update every second
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    const now = new Date();
    const seconds = Math.round((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return d.toLocaleDateString();
  }
}