import { z } from 'zod';
import type { Actions } from './$types.js';

export const actions: Actions = {
  async default({ request }) {
    const form = await request.formData();
    const data = z
      .object({
        email: z.string().email(),
        password: z.string().min(8).max(150).trim(),
      })
      .parse({
        email: form.get('email'),
        password: form.get('password'),
      });

    return data;
  },
};
