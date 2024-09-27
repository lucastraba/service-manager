type Nullable<T> = NonNullable<T> | null;
type Maybe<T> = NonNullable<T> | undefined;
type MaybeNullable<T> = Maybe<T> | Nullable<T>;
type Constructible<T = unknown> = new (...args: unknown[]) => T;
type ModuleWithDefaultExport<T = unknown> = { default: Constructible<T> };
