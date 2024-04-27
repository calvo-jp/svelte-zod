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

type OnSubmitHandler<TData> = (
  data: TData,
  context: OnSubmitContext,
) => void | Promise<void>;

interface CreateValidatorConfig<TData, TZodSchema, TDefaultValue> {
  schema: TZodSchema;
  onSubmit?: OnSubmitHandler<TData>;
  defaultValues?: TDefaultValue;
}

export function createValidator<
  TZodSchema extends z.ZodObject<{}>,
  TSchema extends GenericObject = z.infer<TZodSchema>,
  TKey extends string = FlattenObjectKeys<TSchema>,
  TValue extends GenericObject = DeepPartial<TSchema>,
  TError extends GenericObject = DeepReplaceTypes<TSchema, string>,
  TTouched extends GenericObject = DeepReplaceTypes<TSchema, boolean>,
  TDefaultValue extends GenericObject = DeepPartial<TSchema>,
>({
  /**/
  schema,
  onSubmit,
  defaultValues,
}: CreateValidatorConfig<TSchema, TZodSchema, TDefaultValue>) {
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

          await onSubmit(values as TSchema, {
            reset,
          });

          isSubmitting = false;
        }
      },
    };
  }

  function field(key: TKey) {
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

  function setValue(key: TKey, value: any) {
    touched = {
      ...touched,
      [key]: true,
    };

    values = {
      ...values,
      [key]: value,
    };
  }

  function setValues(newValues: TValue) {
    let v = flatten<GenericObject, GenericObject>(newValues);
    let t = Object.keys(v).reduce<Record<string, boolean>>((o, k) => {
      o[k] = true;
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

  function setError(key: TKey, message: string) {
    touched = {
      ...touched,
      [key]: true,
    };

    errors = {
      ...errors,
      [key]: message,
    };
  }

  function setErrors(newErrors: TError) {
    let e = flatten<GenericObject, GenericObject>(newErrors);
    let t = Object.keys(e).reduce<Record<string, boolean>>((o, k) => {
      o[k] = true;
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
      return unflatten<GenericObject, TValue>(values);
    },
    get errors() {
      return unflatten<GenericObject, TError>(errors);
    },
    get touched() {
      return unflatten<GenericObject, TTouched>(touched);
    },
    get isSubmitting() {
      return isSubmitting;
    },
  };
}
