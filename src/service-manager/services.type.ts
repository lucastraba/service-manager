/**
 * Configuration object for the initialization of the ServiceManager.
 */
export type ServiceManagerConfig<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> = {
  serviceDefinitions: ServiceDefinition<TServices, TInstances>[];
};

/**
 * Defines a service. A service has a class name, optionally an instance name, optionally a list of service injections,
 * optionally a list of post-build asynchronous actions, and a path to the service.
 */
export type ServiceDefinition<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> = {
  serviceClassName: keyof TServices;
  serviceInstanceName?: keyof TInstances;
  serviceInjections?: ServiceInjection<TServices, TInstances>[];
  postBuildAsyncActions?: string[];
  pathToService: () => Promise<
    ModuleWithDefaultExport<TServices[keyof TServices]>
  >;
};

/**
 * Defines a service injection. A service injection can be either a service instance name or a custom injection.
 */
export type ServiceInjection<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> =
  | { serviceInstanceName: keyof TServices | keyof TInstances }
  | { customInjection: unknown };

export type LoadedService = {
  [index: string]: unknown;
};

export type AdaptedServiceDefinition<
  TServices extends ServiceMap,
  TInstances extends ServiceMap = TServices,
> = ServiceDefinition<TServices, TInstances> & {
  serviceInstanceName: keyof TServices | keyof TInstances;
};

export type ServiceMap = Record<string, unknown>;
