/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

import { z } from 'zod';
import { flatten, unflatten } from './flat.js';

type GenericObject = Record<string, unknown>;

type FlattenObjectKeys<T extends GenericObject, K = keyof T> = K extends string
  ? T[K] extends GenericObject
    ? `${K}.${FlattenObjectKeys<T[K]>}`
    : `${K}`
  : never;

type DeepPartial<T extends GenericObject> = T extends GenericObject
  ? {
      /* @ts-expect-error "FIXME: Type 'T[P]' does not satisfy the constraint 'GenericObject'" */
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type DeepReplaceTypes<T extends GenericObject, R> = T extends GenericObject
  ? {
      /* @ts-expect-error "FIXME: Type 'T[P]' does not satisfy the constraint 'GenericObject'" */
      [P in keyof T]?: DeepReplaceTypes<T[P], R>;
    }
  : R;

interface OnSubmitContext {
  reset: () => void;
}

type OnSubmitHandler<T> = (
  data: T,
  context: OnSubmitContext,
) => void | Promise<void>;

interface CreateValidatorConfig<T, S, D> {
  schema: S;
  onSubmit?: OnSubmitHandler<T>;
  defaultValues?: D;
}

export function createValidator<
  S extends z.ZodObject<{}>,
  T extends GenericObject = z.infer<S>,
  /* keys */
  K extends string = FlattenObjectKeys<T>,
  /* values */
  V extends GenericObject = DeepPartial<T>,
  /* default values */
  D extends GenericObject = DeepPartial<T>,
  /* errors */
  E extends GenericObject = DeepReplaceTypes<T, string>,
  /* touched */
  C extends GenericObject = DeepReplaceTypes<T, boolean>,
>({
  /**/
  schema,
  onSubmit,
  defaultValues,
}: CreateValidatorConfig<T, S, D>) {
  let values: GenericObject = $state.frozen(flatten(defaultValues));
  let touched: GenericObject = $state.frozen({});
  let errors: GenericObject = $state.frozen({});

  let isSubmitting = $state(false);
  let hasErrors = $derived(Object.values(errors).some(Boolean));

  $effect(function handleErrors() {
    const v = unflatten(values);
    const d = schema.safeParse(v);
    const e: GenericObject = {};

    d.error?.errors.forEach((o) => {
      if (touched[o.path.toString()] === true) {
        e[o.path.toString()] = o.message;
      }
    });

    errors = flatten(e);
  });

  function form() {
    return {
      nonvalidate: true,
      async onsubmit(e: SubmitEvent) {
        if (isSubmitting) return e.preventDefault();
        if (hasErrors) return e.preventDefault();

        if (onSubmit) {
          e.preventDefault();

          isSubmitting = true;

          await onSubmit(values as unknown as T, {
            reset,
          });

          isSubmitting = false;
        }
      },
    };
  }

  function field(key: K) {
    return {
      value: values[key],
      oninput(e: Event & { currentTarget: { value: string } }) {
        values = {
          ...values,
          [key]: e.currentTarget.value,
        };
      },
      onblur() {
        touched = {
          ...touched,
          [key]: true,
        };
      },
    };
  }

  function setValue(key: K, value: any) {
    touched = {
      ...touched,
      [key]: true,
    };

    values = {
      ...values,
      [key]: value,
    };
  }

  function setValues(newValues: V) {
    let v = flatten(newValues) as GenericObject;
    let t = Object.keys(v).reduce<{ [key: string]: boolean }>((o, key) => {
      o[key] = true;
      return o;
    }, {});

    touched = {
      ...touched,
      ...t,
    };

    values = {
      ...values,
      ...v,
    };
  }

  function setError(key: K, error: string) {
    touched = {
      ...touched,
      [key]: true,
    };

    errors = {
      ...errors,
      [key]: error,
    };
  }

  function setErrors(newErrors: E) {
    let e = flatten(newErrors) as GenericObject;
    let t = Object.keys(e).reduce<{ [key: string]: boolean }>((o, key) => {
      o[key] = true;
      return o;
    }, {});

    touched = {
      ...touched,
      ...t,
    };

    errors = {
      ...errors,
      ...e,
    };
  }

  function reset() {
    values = flatten(defaultValues);
    errors = {};
    touched = {};
  }

  return {
    form,
    field,
    reset,
    setValue,
    setValues,
    setError,
    setErrors,
    get values() {
      return unflatten<GenericObject, V>(values);
    },
    get errors() {
      return unflatten<GenericObject, E>(errors);
    },
    get touched() {
      return unflatten<GenericObject, C>(touched);
    },
    get isSubmitting() {
      return isSubmitting;
    },
  };
}
