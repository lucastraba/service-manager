export type Nullable<T> = NonNullable<T> | null;
export type Maybe<T> = NonNullable<T> | undefined;
export type MaybeNullable<T> = Maybe<T> | Nullable<T>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructible<T = unknown> = new (...args: any[]) => T;
export type ModuleWithDefaultExport<T = unknown> = {
  default: Constructible<T>;
};
