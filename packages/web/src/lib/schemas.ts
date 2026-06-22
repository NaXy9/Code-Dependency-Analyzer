import { z } from 'zod';

/**
 * Generic Zod resolver for react-hook-form.
 * Returning `any` avoids the strict ResolverResult union type;
 * useForm still infers the correct generic at the call site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
