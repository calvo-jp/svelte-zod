/* eslint-disable @typescript-eslint/no-explicit-any */

import { tick } from 'svelte';
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

export function createValidator<
  TZodSchema extends z.ZodObject<z.ZodRawShape>,
  TSchema extends GenericObject = z.infer<TZodSchema>,
  TKey extends string = FlattenObjectKeys<TSchema>,
  TValue extends GenericObject = DeepPartial<TSchema>,
  TError extends GenericObject = DeepReplaceTypes<TSchema, string>,
  TTouched extends GenericObject = DeepReplaceTypes<TSchema, boolean>,
  TDefaultValue extends GenericObject = DeepPartial<TSchema>,
>(config: {
  schema: TZodSchema;
  defaultValues?: TDefaultValue;
  onSubmit?: (
    data: TSchema,
    context: {
      reset: () => void;
      setError: (key: TKey, message: string) => void;
      setValue: (key: TKey, value: unknown) => void;
      setErrors: (errors: TError) => void;
      setValues: (values: TValue) => void;
    },
  ) => void | Promise<void>;
}) {
  const {
    /**/
    schema,
    onSubmit,
    defaultValues,
  } = $derived.by(() => {
    return {
      schema: config.schema,
      onSubmit: config.onSubmit ?? function noop() {},
      defaultValues: config.defaultValues ? flatten(config.defaultValues) : {},
    };
  });

  let values: GenericObject = $state.frozen(defaultValues);
  let touched: GenericObject = $state.frozen({});
  let errors: GenericObject = $state.frozen({});
  let isSubmitting = $state(false);

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
      novalidate: true,
      async onsubmit(e: SubmitEvent) {
        await tick();

        if (isSubmitting) return e.preventDefault();
        if (Object.values(errors).some(Boolean)) return e.preventDefault();

        if (onSubmit) {
          e.preventDefault();

          isSubmitting = true;

          await onSubmit(unflatten<GenericObject, TSchema>(values), {
            reset,
            setValue,
            setValues,
            setError,
            setErrors,
          });

          isSubmitting = false;
        }
      },
    };
  }

  function field(key: TKey, userProps?: { [key: string]: any }) {
    return {
      ...userProps,
      value: values[key],
      oninput(
        event: Event & {
          currentTarget: {
            value: string;
            [key: string]: any;
          };
        },
      ) {
        userProps?.oninput?.(event);

        touched = {
          ...touched,
          [key]: true,
        };

        values = {
          ...values,
          [key]: event.currentTarget.value,
        };
      },
      onblur(
        event: FocusEvent & {
          currentTarget: {
            value: string;
            [key: string]: any;
          };
        },
      ) {
        userProps?.onblur?.(event);

        touched = {
          ...touched,
          [key]: true,
        };
      },
    };
  }

  function setValue(key: TKey, value: unknown) {
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
    const v = flatten<GenericObject, GenericObject>(newValues);

    touched = {
      ...touched,
      ...toTouched(v),
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
    const e = flatten<GenericObject, GenericObject>(newErrors);

    touched = {
      ...touched,
      ...toTouched(e),
    };

    errors = {
      ...errors,
      ...e,
    };
  }

  function reset() {
    values = defaultValues;
    errors = {};
    touched = {};
    isSubmitting = false;
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

/**
 * @param subject flattened object
 */
function toTouched(subject: GenericObject) {
  const i = Object.keys(subject);
  const j: GenericObject = {};

  i.forEach((k) => (j[k] = true));

  return j;
}
