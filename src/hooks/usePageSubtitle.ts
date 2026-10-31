import { inventoryService } from '../services/inventoryService';

/** Returns the editable subtitle for a module, falling back to its built-in description. */
export function usePageSubtitle(pageKey: string, defaultSubtitle: string): string {
  const settings = inventoryService.getSettings();
  return settings.pageSubtitles?.[pageKey]?.trim() || defaultSubtitle;
}
