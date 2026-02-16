import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogService } from '../../services/logs.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.html',
  styleUrl: './logs.scss'
})
export class LogsComponent implements OnInit, OnDestroy {
  // 1. Inject the shared service
  private logService = inject(LogService);
  
  // 2. Reference the service's logs signal directly
  // This makes the UI update automatically when any other component calls addLog()
  logs = this.logService.logs; 

  today: Date = new Date();
  private clockInterval: any;

  ngOnInit() {
    // UI Clock for the header uniformity
    this.clockInterval = setInterval(() => { 
      this.today = new Date(); 
    }, 1000);

    // Initial system boot log if the list is empty
    if (this.logs().length === 0) {
      this.logService.addLog('SECURITY', 'SYSTEM_DIAGNOSTIC_INITIALIZED', 'SUCCESS');
    }
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }
}