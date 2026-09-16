/**
 * Asana's MCP tool schemas can evolve; rather than hardcoding strict Zod
 * shapes per tool, tolerate the couple of list shapes a tool call can return:
 * a bare array, or an object with a `data`/named-key array inside it.
 */
export function listItems(result: unknown, key?: string): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (key && Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
  }
  return [];
}

export function asItem(result: unknown): Record<string, unknown> {
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as Record<string, unknown>;
    }
    return obj;
  }
  return {};
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'} found`;
}
