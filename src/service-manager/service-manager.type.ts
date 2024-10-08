import { ModuleWithDefaultExport } from '../common.type';
/**
 * Configuration object for the initialization of the ServiceManager.
 */
export type ServiceManagerConfig<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> = {
  /** The service definitions that will be available for the loading of the services. */
  serviceDefinitions: ServiceDefinition<TServices, TInstances>[];
};

/**
 * Defines a service. A service has a class name, optionally an instance name, optionally a list of service injections,
 * optionally a list of post-build asynchronous actions, and a path to the service, so that the service can be loaded asynchronously.
 */
export type ServiceDefinition<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> = {
  /** The class name of the service. */
  serviceClassName: keyof TServices;
  /** The instance name of the service. If not provided, the `serviceClassName` will be used. */
  serviceInstanceName?: keyof TInstances;
  /** An array of service injections. Optional. */
  serviceInjections?: ServiceInjection<TServices, TInstances>[];
  /** An array of post-build asynchronous actions. Optional. */
  postBuildAsyncActions?: string[];
  /** A function that returns a promise resolving to the service. */
  pathToService: () => Promise<
    ModuleWithDefaultExport<TServices[keyof TServices]>
  >;
};

/**
 * Defines a service injection. A service injection can be either a service instance name (or class name) or a custom injection.
 */
export type ServiceInjection<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> =
  | {
      /** The instance or class name of the service to be injected. */
      serviceInstanceName: keyof TServices | keyof TInstances;
    }
  | {
      /** A custom injection (any value). */
      customInjection: unknown;
    };

/** @internal */
export type LoadedService = {
  [index: string]: unknown;
};

/** @internal */
export type AdaptedServiceDefinition<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> = ServiceDefinition<TServices, TInstances> & {
  serviceInstanceName: keyof TServices | keyof TInstances;
};

/** @internal */
export type ServiceMap = Record<string, unknown>;
