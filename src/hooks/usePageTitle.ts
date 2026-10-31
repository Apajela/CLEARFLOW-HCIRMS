import { inventoryService } from '../services/inventoryService';

/** Returns the editable title for a module, falling back to its built-in title. */
export function usePageTitle(pageKey: string, defaultTitle: string): string {
  const settings = inventoryService.getSettings();
  return settings.pageTitles?.[pageKey]?.trim() || defaultTitle;
}
