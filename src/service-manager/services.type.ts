/**
 * Configuration object for the initialization of the ServiceManager.
 */
export type ServiceManagerConfig<TServices extends ServiceMap> = {
  /** The service definitions that will be available for the loading of the services.
   * @remarks
   * If you want to load the services automatically, you can use `import.glob.meta`.
   * Use the following snippet (asterisks have been escaped with [] due to limitations of Typedoc):
   * ```ts
   * const serviceDefinitions = [];
   * const definitionFiles = import.meta.glob<{ default: ServiceDefinition[]; }>(`src/[**]/[*].definitions.ts`);
   * for (const path in definitionFiles) {
   *       const { default: definition } = await definitionFiles[path]();
   *       serviceDefinitions.push(...definition);
   *     }
   * ```
   * This will collect all the definitions from the `src` folder and its sub-folders.
   **/
  serviceDefinitions: ServiceDefinition<TServices>[];
};

/**
 * Defines a service. A service has a class name, optionally an instance name, optionally a list of service injections,
 * optionally a list of post-build asynchronous actions, and a path to the service.
 */
export type ServiceDefinition<TServices extends ServiceMap> = {
  /** The class name of the service. This must match exactly with the name of your service's class. */
  serviceClassName: Extract<keyof TServices, string>;
  /** The instance name of the service. If not provided, the `serviceClassName` will be used.
   * This option is useful if you want to have multiple instances of the same service but with different
   * injections. The only requirement is that the injections share the same interface.
   **/
  serviceInstanceName?: Extract<keyof TServices, string>;
  /** An array of service injections. Optional. */
  serviceInjections?: ServiceInjection<TServices>[];
  /** An array of post-build asynchronous actions. Optional.
   * Use this option if you want to perform some asynchronous actions after the service has been built.
   * If the actions are not asynchronous, it is recommended that you perform them in the constructor
   * of your service instead.
   * */
  postBuildAsyncActions?: string[];
  /** A function that returns a promise resolving to the service */
  pathToService: () => Promise<
    ModuleWithDefaultExport<TServices[keyof TServices]>
  >;
};

/**
 * Defines a service injection. A service injection can be either a service instance name or a custom injection.
 */
export type ServiceInjection<TServices extends ServiceMap> =
  | {
      /** The instance name of the service to be injected.
       * The injected service must have its own definition.
       * Where the definition is located is not important as long as it is provided during initialization.
       **/
      serviceInstanceName: Extract<keyof TServices, string>;
    }
  | {
      /** A custom injection.
       * This can be any value or object you want to inject into your service.
       * */
      customInjection: unknown;
    };

export type LoadedService = {
  [index: string]: unknown;
};

export type AdaptedServiceDefinition<TServices extends ServiceMap> =
  ServiceDefinition<TServices> & {
    serviceInstanceName: keyof TServices;
  };

export type ServiceMap = Record<string, unknown>;
