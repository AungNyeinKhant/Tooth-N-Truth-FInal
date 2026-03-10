import apiClient from './axios-instance';

export interface CalendarStatus {
  isConnected: boolean;
  syncEnabled: boolean;
  lastSyncAt: string | null;
}

export const calendarApi = {
  // Get calendar OAuth URL
  getConnectUrl: () => {
    console.log('[Calendar API] Getting connect URL');
    return apiClient.get<{ url: string }>('/api/calendar/connect');
  },

  // Get calendar status
  getStatus: () => {
    console.log('[Calendar API] Getting status');
    return apiClient.get<CalendarStatus>('/api/calendar/status');
  },

  // Toggle sync
  toggleSync: (enabled: boolean) => {
    console.log('[Calendar API] Toggling sync:', enabled);
    return apiClient.post<{ message: string }>(`/api/calendar/toggle-sync?enabled=${enabled}`);
  },

  // Disconnect calendar
  disconnect: () => {
    console.log('[Calendar API] Disconnecting');
    return apiClient.post<{ message: string }>('/api/calendar/disconnect');
  },
};
