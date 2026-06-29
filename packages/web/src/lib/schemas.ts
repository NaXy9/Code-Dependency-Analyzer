import { z } from 'zod';

export function zodResolver(schema: z.ZodTypeAny): any {
  return async (values: unknown) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || 'root';
      if (!errors[path]) {
        errors[path] = { type: String(issue.code), message: issue.message };
      }
    }
    return { values: {}, errors };
  };
}
