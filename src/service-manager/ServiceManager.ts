import DependencyResolver from './DependencyResolver';
import {
  DefinitionNotFoundError,
  InvalidInjectionError,
  InvalidPostBuildActionError,
} from './serviceManager.error';
import type {
  AdaptedServiceDefinition,
  LoadedService,
  ServiceDefinition,
  ServiceInjection,
  ServiceManagerConfig,
  ServiceMap,
} from './services.type';

/**
 * The ServiceManager is an IoC container.
 * It is responsible for loading services and their dependencies.
 *
 * @example
 * 1. Define the classes to be used as services.
 * ```ts
 * class MyClass {
 *   constructor(private readonly myDependency: MyDependency){}
 * }
 * class MyDependency {}
 *
 * class MySecondDependency extends MyDependency {}
 * ```
 *
 * 2. Create a map type of your services. This allows the ServiceManager to infer
 * the return type of the service when loading, to autocomplete the available services,
 * to allow you to use the `.SERVICES` property of the ServiceManager's instance
 * for even more runtime safety, and to have type safety for service definitions.
 * ```ts
 * type Services = {
 *   MyService: MyService,
 *   MyDependency: MyDependency,
 *   MySecondDependency: MySecondDependency
 * }
 * ```
 * Additionally, you can define a type for your instances, if you have multiple instances of the same service.
 * This is only required if you have multiple instances of the same service with different injections.
 * Remember that the injections must have the same interface.
 * If you define a type for your instances, you have to pass it as the second generic to the ServiceManager,
 * and to the definitions type if you want the type safety.
 * ```ts
 * type Instances = {
 *   myServiceInstance: MyClass,
 *   myDependencyInstance: MyDependency,
 *
 * };
 * ```
 *
 * 3. Create a definitions file.
 * In this example, we're passing both generics.
 * ```ts
 * // myDomain.definition.ts
 * const definitions: ServiceDefinition<Services, Instances>[] = [
 *   {
 *     serviceClassName: 'MyClass', // This will be autocompleted if you pass the first generic.
 *     serviceInjections: [
 *       { serviceInstanceName: 'MyDependency' }, // This will be autocompleted smartly if you pass one or both generics.
 *     ],
 *     pathToService: async () => import('./MyClass'), // This is used to load the service asynchronously.
 *   },
 *   {
 *     serviceClassName: 'MyClass', // Note that we're reusing the class name, but with different instance name.
 *     serviceInstanceName: 'myServiceOtherInstance', // This will be autocompleted if you pass the second generic.
 *     serviceInjections: [{ serviceInstanceName: 'MySecondDependency' }],
 *     pathToService: async () => import('./MySecondDependency'),
 *   },
 *   {
 *     serviceClassName: 'MyDependency',
 *     pathToService: async () => import('./MyDependency'),
 *   },
 *   {
 *     serviceClassName: 'MySecondDependency',
 *     pathToService: async () => import('./MySecondDependency'),
 *   },
 * ];
 *
 * export default definitions;
 * ```
 * Note the following:
 * - The service instance name is optional. If not provided, the service class name will be used.
 * - The service instance name must be unique.
 * - The service class name must be unique.
 * - The path to the service must be a function that returns a promise.
 * - The path to the service must be a relative path.
 * - The path to the service must be a valid path.
 *
 * What we're doing here is that we're creating a list of instructions for the ServiceManager.
 *
 * These definitions will produce:
 * - A MyClass instance with a MyDependency instance injected.
 * - A MyClass instance with a MySecondDependency instance injected.
 * - A MyDependency instance.
 * - A MySecondDependency instance.
 *
 * All these instances are singletons and will be reused by the ServiceManager
 * every time you call {@link ServiceManager.loadService} or {@link ServiceManager.loadServices}
 * on your ServiceManager instance, and the service names will be available
 * in the {@link ServiceManager.SERVICES} of the instance,
 * in case you don't want to rely on string literals.
 *
 * Additionally, if you define each class in a separate file,
 * the ServiceManager will be able to load them asynchronously on demand.
 * This is why the {@link ServiceManager.loadService} must be awaited.
 *
 * 4. Use with {@link ServiceManager.loadService}
 * ```ts
 * // myFunctionality.ts
 * const myCoolService = await serviceManager.loadService('MyClass');
 * ```
 * or
 * ```ts
 * // myFunctionality.ts
 * const myCoolService = await serviceManager.loadServices(['MyClass', 'myServiceOtherInstance']);
 * ```
 * or
 * ```ts
 * // myFunctionality.ts
 * const myCoolService = await serviceManager.loadService(serviceManager.SERVICES.MyClass);
 * ```
 *
 * All of this is type safe, and the return type of the service will be correctly inferred.
 * Please note that if you load multiple services, you will have to check whether
 * the services in the array are undefined, or cast them manually.
 */
export default class ServiceManager<
  TServices extends ServiceMap,
  TInstances extends Record<string, unknown> = TServices,
> {
  /**
   * A map of service names, where both the key and the value are the service instance name
   * or the service class name if the instance name is not defined.
   */
  public SERVICES: {
    [K in keyof (TServices & TInstances)]: K;
  } = {} as {
    [K in keyof (TServices & TInstances)]: K;
  };

  private dependencyResolver = new DependencyResolver<TServices, TInstances>();
  private loadedServices: LoadedService = {};

  /**
   * Constructs a new ServiceManager.
   *
   * @param config - The configuration object containing service definitions.
   */
  constructor({
    serviceDefinitions,
  }: ServiceManagerConfig<TServices, TInstances>) {
    this.dependencyResolver.serviceDefinitions = serviceDefinitions;
    this.populateAvailableServiceNames(serviceDefinitions);
  }

  /**
   * Loads a service by its instance name.
   *
   * @param serviceInstanceName - The name of the service instance to load.
   * @returns A promise that resolves with the service instance.
   */
  public async loadService<K extends keyof (TServices & TInstances)>(
    serviceInstanceName: K
  ): Promise<(TServices & TInstances)[K]> {
    return (await this.loadServiceInternal(
      serviceInstanceName as string
    )) as (TServices & TInstances)[K];
  }

  /**
   * Loads multiple services in parallel.
   *
   * @param serviceInstanceNames - An array of service instance names to load.
   * @returns A promise that resolves with an array of service instances.
   */
  public async loadServices<K extends keyof (TServices & TInstances)>(
    serviceInstanceNames: K[] = []
  ): Promise<(TServices & TInstances)[K][]> {
    const promises = serviceInstanceNames.map((name) => this.loadService(name));
    return await Promise.all(promises);
  }

  /**
   * @internal
   */
  private populateAvailableServiceNames(
    serviceDefinitions: ServiceDefinition<TServices, TInstances>[]
  ) {
    this.SERVICES = {} as {
      [K in keyof (TServices & TInstances)]: K;
    };
    serviceDefinitions.forEach((serviceDefinition) => {
      const serviceInstanceName = serviceDefinition.serviceInstanceName;
      const serviceClassName = serviceDefinition.serviceClassName;
      if (serviceInstanceName) {
        this.SERVICES[serviceInstanceName as keyof TInstances] =
          serviceInstanceName as keyof TInstances;
      } else {
        this.SERVICES[serviceClassName as keyof TServices] =
          serviceClassName as keyof TServices;
      }
    });
  }

  /**
   * @internal
   */
  private async loadServiceInternal(
    serviceInstanceName: string
  ): Promise<unknown> {
    const service = this.loadedServices[serviceInstanceName];
    if (service) {
      return service;
    }
    const serviceDefinition =
      this.dependencyResolver.getServiceDefinition(serviceInstanceName);
    if (!serviceDefinition) {
      throw new DefinitionNotFoundError(
        `Could not find service definition for instance name "${serviceInstanceName}".`
      );
    }
    if (!('serviceInstanceName' in serviceDefinition)) {
      serviceDefinition['serviceInstanceName'] =
        serviceDefinition.serviceClassName as keyof TInstances;
    }
    return await this.getInstanceInternal(
      serviceDefinition as AdaptedServiceDefinition<TServices, TInstances>
    );
  }

  /**
   * @internal
   */
  private async getInstanceInternal(
    serviceDefinition: AdaptedServiceDefinition<TServices, TInstances>
  ): Promise<unknown> {
    if (
      !this.dependencyResolver.isModuleLoaded(
        serviceDefinition.serviceInstanceName as string
      )
    ) {
      await this.dependencyResolver.resolve(serviceDefinition);
    }
    const instance = await this.createInstance(serviceDefinition);
    this.loadedServices[serviceDefinition.serviceInstanceName as string] =
      instance;
    return instance;
  }

  /**
   * @internal
   */
  private async createInstance(
    serviceDefinition: AdaptedServiceDefinition<TServices, TInstances>
  ): Promise<unknown> {
    let injections: unknown[] = [];
    if (serviceDefinition.serviceInjections) {
      injections = await this.parseInjections(
        serviceDefinition.serviceInjections as ServiceInjection<TInstances>[]
      );
    }
    const DefinitionConstructor = this.dependencyResolver.getLoadedModule(
      serviceDefinition.serviceInstanceName as string
    );
    const instance = new DefinitionConstructor(...injections);
    await this.postBuildActions(
      serviceDefinition,
      instance as Record<string, unknown>
    );
    this.dependencyResolver.deleteModulePromise(
      serviceDefinition.serviceInstanceName as string
    );
    return instance;
  }

  /**
   * @internal
   */
  private async parseInjections(
    injections: ServiceInjection<TInstances>[]
  ): Promise<unknown[]> {
    const loadedInjections: unknown[] = [];
    for (const injection of injections) {
      let loadedInjection = undefined;
      if (this.isServiceInstanceInjection(injection)) {
        loadedInjection = await this.loadService(
          injection.serviceInstanceName as keyof (TServices & TInstances)
        );
      } else if (this.isCustomInjection(injection)) {
        loadedInjection = injection.customInjection;
      } else {
        throw new InvalidInjectionError(
          `Invalid injection object: ${JSON.stringify(injection)}. Only 'serviceInstanceName' and 'customInjection' keys are allowed.`
        );
      }
      if (loadedInjection) loadedInjections.push(loadedInjection);
    }
    return loadedInjections;
  }

  /**
   * @internal
   */
  private isServiceInstanceInjection(
    injection: ServiceInjection<TInstances>
  ): injection is { serviceInstanceName: Extract<keyof TInstances, string> } {
    return 'serviceInstanceName' in injection;
  }

  /**
   * @internal
   */
  private isCustomInjection(
    injection: ServiceInjection<TInstances>
  ): injection is { customInjection: unknown } {
    return 'customInjection' in injection;
  }

  /**
   * @internal
   */
  private async postBuildActions(
    serviceDefinition: AdaptedServiceDefinition<TServices, TInstances>,
    instance: Record<string, unknown>
  ) {
    if (!serviceDefinition.postBuildAsyncActions) return;
    for (const methodName of serviceDefinition.postBuildAsyncActions) {
      const method = instance[methodName];
      if (typeof method === 'function') {
        await method.call(instance);
        continue;
      }
      throw new InvalidPostBuildActionError(
        `Post build action "${methodName}" failed to execute in ${String(serviceDefinition.serviceClassName)}.`
      );
    }
  }
}
