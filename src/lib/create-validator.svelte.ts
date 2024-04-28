/* eslint-disable @typescript-eslint/no-explicit-any */

import { tick } from 'svelte';
import { flatten } from './flatten.js';
import { unflatten } from './unflatten.js';

import type { z } from 'zod';
import type {
  ErrorSchema,
  FlattenObjectKeys,
  GenericObject,
  TouchedSchema,
  ValueSchema,
} from './types.js';

export function createValidator<
  TZodSchema extends z.ZodObject<z.ZodRawShape>,
  TSchema extends GenericObject = z.infer<TZodSchema>,
  TKey extends string = FlattenObjectKeys<TSchema>,
  TValue extends GenericObject = ValueSchema<TSchema>,
  TDefaultValue extends GenericObject = ValueSchema<TSchema>,
  TError extends GenericObject = ErrorSchema<TSchema>,
  TTouched extends GenericObject = TouchedSchema<TSchema>,
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
  let isSubmitting = $state(false);

  let _errors: GenericObject = $state.frozen({});

  const errors: GenericObject = $derived.by(() => {
    const parseResult = schema.safeParse(unflatten(values));
    const mergedErrors = {
      ..._errors,
    };

    parseResult.error?.errors.forEach((obj) => {
      const key = obj.path.toString();

      if (touched[key]) {
        mergedErrors[key] = obj.message;
      }
    });

    return mergedErrors;
  });

  function form(props?: Record<string, any>) {
    return {
      ...props,
      novalidate: true,
      async onsubmit(event: SubmitEvent) {
        touched = toTouchedSchema(values);

        await tick();

        props?.onsubmit?.(event);

        if (isSubmitting) return event.preventDefault();
        if (Object.values(errors).some(Boolean)) return event.preventDefault();

        if (onSubmit) {
          event.preventDefault();

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

  function field(key: TKey, props?: Record<string, any>) {
    return {
      ...props,
      value: values[key],
      oninput(
        event: Event & {
          currentTarget: EventTarget & {
            value: string;
            [key: string]: any;
          };
        },
      ) {
        props?.oninput?.(event);

        _errors = {
          ..._errors,
          [key]: undefined,
        };

        values = {
          ...values,
          [key]: event.currentTarget?.value,
        };
      },
      onblur(
        event: FocusEvent & {
          currentTarget: EventTarget & {
            value: string;
            [key: string]: any;
          };
        },
      ) {
        props?.onblur?.(event);

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

    _errors = {
      ..._errors,
      [key]: undefined,
    };
  }

  function setValues(newValues: TValue) {
    const v = flatten<GenericObject, GenericObject>(newValues);

    touched = {
      ...touched,
      ...toTouchedSchema(v),
    };

    values = {
      ...values,
      ...v,
    };

    const e = { ..._errors };
    const l = Object.keys(e);

    l.forEach((k) => delete e[k]);

    _errors = e;
  }

  function setError(key: TKey, message: string) {
    touched = {
      ...touched,
      [key]: true,
    };

    _errors = {
      ...errors,
      [key]: message,
    };
  }

  function setErrors(newErrors: TError) {
    const e = flatten<GenericObject, GenericObject>(newErrors);

    touched = {
      ...touched,
      ...toTouchedSchema(e),
    };

    _errors = {
      ...errors,
      ...e,
    };
  }

  function reset() {
    values = defaultValues;
    touched = {};
    _errors = {};
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

function toTouchedSchema(o: GenericObject) {
  const i = Object.keys(o);
  const j: GenericObject = {};

  i.forEach((k) => (j[k] = true));

  return j;
}
