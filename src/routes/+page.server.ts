import type { Actions } from './$types.js';

export const actions: Actions = {
  async default({ request }) {
    const form = await request.formData();
    const data = {
      email: form.get('email'),
      password: form.get('password'),
    };

    console.log(data);

    return {
      scucess: true,
    };
  },
};
