export type GenericObject = Record<string, unknown>;
export type BuiltInObject = Date;

export type FlattenObjectKeys<
  T extends GenericObject,
  K = keyof T,
> = K extends string
  ? T[K] extends GenericObject
    ? `${K}.${FlattenObjectKeys<T[K]>}`
    : `${K}`
  : never;

export type ValueSchema<T> = T extends BuiltInObject
  ? T
  : T extends object
    ? {
        [P in keyof T]?: ValueSchema<T[P]>;
      }
    : T;

export type ErrorSchema<T> = T extends BuiltInObject
  ? string
  : T extends object
    ? {
        [P in keyof T]?: ErrorSchema<T[P]>;
      }
    : string;

export type TouchedSchema<T> = T extends BuiltInObject
  ? boolean
  : T extends object
    ? {
        [P in keyof T]?: TouchedSchema<T[P]>;
      }
    : boolean;
