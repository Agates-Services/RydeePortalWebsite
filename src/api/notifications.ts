export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// The backend has no notifications endpoint yet (it is not in docs/design/API-Document-V1.pdf),
// so this returns an empty list and the page shows its empty state. When the endpoint exists,
// call it here, for example: post<{ notifications: PortalNotification[] }>(joinUrl("/get-notifications")).
export async function getNotifications(): Promise<PortalNotification[]> {
  return [];
}
