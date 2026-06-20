import { z } from 'zod';

export const analyzeFormSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Path is required')
    .refine(
      (v) => v.startsWith('/') || /^[A-Za-z]:[/\\]/.test(v),
      'Must be an absolute path  —  /home/user/project  or  C:\\Users\\user\\project'
    ),
});

export type AnalyzeFormValues = z.infer<typeof analyzeFormSchema>;
