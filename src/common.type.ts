export type Nullable<T> = NonNullable<T> | null;
export type Maybe<T> = NonNullable<T> | undefined;
export type MaybeNullable<T> = Maybe<T> | Nullable<T>;
export type Constructible<T = unknown> = new (...args: unknown[]) => T;
export type ModuleWithDefaultExport<T = unknown> = {
  default: Constructible<T>;
};
