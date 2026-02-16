import { Injectable, signal } from '@angular/core';

export interface LogEntry {
  timestamp: string;
  category: 'NETWORK' | 'SECURITY' | 'PAYROLL';
  event: string;
  status: 'SUCCESS' | 'WARN' | 'FAIL';
}

@Injectable({ providedIn: 'root' })
export class LogService {
  logs = signal<LogEntry[]>([]);
  private eventSource!: EventSource;

  constructor() {
    this.connectToBackendStream();
  }

  private connectToBackendStream() {
  // Use 'withCredentials: true' if your Java backend has config.setAllowCredentials(true)
  this.eventSource = new EventSource('https://backend-whrl.onrender.com/api/employees/api/logs/stream', {
    withCredentials: true 
  });

  this.eventSource.onopen = () => {
    console.log(">> VINTAGE_LINK_ESTABLISHED: Terminal receiving data.");
    this.addLog('NETWORK', 'BACKEND_STREAM_CONNECTED', 'SUCCESS');
  };

  this.eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    this.logs.update(current => [data, ...current].slice(0, 50));
  };

  this.eventSource.onerror = (error) => {
    console.error('SSE Connection Failed. Check CORS or Server Status.');
    // Don't close immediately; EventSource will try to auto-reconnect
  };
}

  // Still keeping the manual method for frontend-only events
  addLog(category: 'NETWORK' | 'SECURITY' | 'PAYROLL', event: string, status: 'SUCCESS' | 'WARN' | 'FAIL') {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      category,
      event,
      status
    };
    this.logs.update(current => [newLog, ...current].slice(0, 50));
  }
}