<script lang="ts">
  import { enhance } from '$app/forms';
  import { z } from 'zod';
  import { createValidator } from '../lib/create-validator.svelte.js';

  let schema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(150).trim(),
  });

  let v = createValidator({
    schema,
    onSubmit(d) {
      console.log('Success!');
      console.log(d);
    },
    defaultValues: {
      email: '',
      password: '',
    },
  });

  $inspect('errors', v.errors);
  $inspect('values', v.values);
  $inspect('touched', v.touched);
</script>

<form method="post" action="/" use:enhance {...v.form()}>
  <div>
    <input placeholder="Email" {...v.field('email')} />
    <p>{v.errors.email}</p>
  </div>
  <div>
    <input placeholder="Password" {...v.field('password')} />
    <p>{v.errors.password}</p>
  </div>
  <div>
    <button type="submit" disabled={v.isSubmitting}>Login</button>
  </div>
</form>
