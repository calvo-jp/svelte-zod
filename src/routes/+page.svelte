<script lang="ts">
  import { z } from 'zod';
  import { createValidator } from '../lib/create-validator.svelte.js';

  let schema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(150).trim(),
  });

  let v = createValidator({
    schema,
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit(data) {
      console.log(data);
    },
  });
</script>

<form {...v.form()}>
  <div>
    <input name="email" placeholder="Email" {...v.field<HTMLInputElement>('email',{
      oninput(e){
        console.log(e.currentTarget.value)
      }
    })}/>
    <p>{v.errors.email}</p>
  </div>
  <div>
    <input name="password" placeholder="Password" {...v.field('password')} />
    <p>{v.errors.password}</p>
  </div>
  <div>
    <button type="submit" disabled={v.isSubmitting}>Login</button>
  </div>
</form>
