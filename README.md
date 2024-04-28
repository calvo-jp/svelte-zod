# Svelte Zod

## Installation

```bash
npm install svelte-zod
```

## Usage

```svelte
<script>
  import { createValidator } from 'svelte-zod';
  import { z } from 'zod';

  let v = createValidator({
    schema: z.object({
      email: z.string().email(),
      password: z.string().min(8).max(150).trim(),
    }),
    onSubmit(data) {
      console.log(data);
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

<form {...v.form()}>
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
```

## API

_coming soon_
