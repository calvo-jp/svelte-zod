<script lang="ts">
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

<form method="post" {...v.form()}>
  <div>
    <input placeholder="Email" {...v.field('email')} />

    {#if v.errors.email}
      <p>{v.errors.email}</p>
    {/if}
  </div>
  <div>
    <input placeholder="Password" {...v.field('password')} />

    {#if v.errors.password}
      <p>{v.errors.password}</p>
    {/if}
  </div>
  <div>
    <button type="submit">Login</button>
  </div>
</form>
