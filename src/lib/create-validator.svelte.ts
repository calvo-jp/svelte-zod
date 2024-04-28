/* eslint-disable @typescript-eslint/no-explicit-any */

import { flatten } from './flatten.js';
import { unflatten } from './unflatten.js';

import { tick } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';
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
  /**/
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
      onSubmit: config.onSubmit,
      defaultValues: config.defaultValues ? flatten(config.defaultValues) : {},
    };
  });

  let values: GenericObject = $state.frozen(defaultValues);
  let touched: GenericObject = $state.frozen({});

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

  const isDirty = $derived(Object.keys(touched).length > 0);
  const isValid = $derived(Object.values(errors).every((v) => !v));

  let isSubmitting = $state(false);

  function form(props?: SvelteHTMLElements['form']) {
    return {
      ...props,
      novalidate: true,
      onsubmit: async (event: SubmitEvent) => {
        event.preventDefault();

        touched = toTouchedSchema(values);

        await tick();

        if (!isValid) return;
        if (isSubmitting) return;

        isSubmitting = true;

        const fields = unflatten<GenericObject, TSchema>(values);

        await onSubmit?.(fields, {
          reset,
          setValue,
          setValues,
          setError,
          setErrors,
        });

        isSubmitting = false;
      },
    };
  }

  function field(
    key: TKey,
    props?:
      | SvelteHTMLElements['input']
      | SvelteHTMLElements['select']
      | SvelteHTMLElements['textarea'],
  ) {
    return {
      value: values[key],
      onchange(
        event: Event & {
          currentTarget: EventTarget &
            (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
        },
      ) {
        props?.onchange?.(event as any);

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
          currentTarget: EventTarget &
            (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
        },
      ) {
        props?.onblur?.(event as any);

        touched = {
          ...touched,
          [key]: true,
        };
      },
    };
  }

  function setValue(path: TKey, value: unknown) {
    touched = {
      ...touched,
      [path]: true,
    };

    values = {
      ...values,
      [path]: value,
    };

    _errors = {
      ..._errors,
      [path]: undefined,
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

  function setError(path: TKey, message: string) {
    touched = {
      ...touched,
      [path]: true,
    };

    _errors = {
      ...errors,
      [path]: message,
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

  function setTouched(path: TKey) {
    touched = {
      ...touched,
      [path]: true,
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
    setTouched,
    get values() {
      return unflatten<GenericObject, TValue>(values);
    },
    get errors() {
      return unflatten<GenericObject, TError>(errors);
    },
    get touched() {
      return unflatten<GenericObject, TTouched>(touched);
    },
    get isDirty() {
      return isDirty;
    },
    get isValid() {
      return isValid;
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
