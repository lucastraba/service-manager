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
 * 1. We write the classes we will use.
 * ```ts
 * class MyClass {
 *   constructor(private readonly myDependency: MyDependency){}
 * }
 * class MyDependency {}
 * ```
 *
 * 2. If available, we add it to the declaration file, so that {@link ServiceManager.SERVICES} can auto-complete.
 * ```ts
 * // ServiceManager.d.ts
 * declare module '@lucastraba/service-manager' {
 *  type Service = {
 *    MyClass: 'MyClass';
 *    MyDependency: 'MyDependency';
 *  }
 * }
 * ```
 *
 * 3. We create a definitions file. If the project has set an auto-importing mechanism,
 * make sure that the file is named '*.definition.ts' or whatever naming convention you
 * have defined for the auto-importing.
 * Here, we define a group of {@link ServiceDefinition} objects.
 * ```ts
 * // myDomain.definition.ts
 * const definitions: ServiceDefinition[] = [
 *   {
 *     serviceClassName: ServiceManager.SERVICES.MyClass,
 *     serviceInjections: [
 *       {
 *         serviceInstanceName: ServiceManager.SERVICES.MyDependency,
 *       },
 *     ],
 *     pathToService: async () => import('./MyClass'),
 *   },
 *  {
 *     serviceClassName: ServiceManager.SERVICES.MyDependency,
 *     pathToService: async () => import('./MyDependency'),
 *   },
 * ],
 *
 * export default definitions;
 * ```
 *
 * 4. We use it with {@link ServiceManager.loadService}
 * ```ts
 * // myFunctionality.ts
 * const myCoolService = ServiceManager.loadService(ServiceManager.SERVICES.MyClass) as MyClass;
 * ```
 */
export default class ServiceManager<TServices extends ServiceMap> {
  public SERVICES: { [K in Extract<keyof TServices, string>]: K } = {} as {
    [K in Extract<keyof TServices, string>]: K;
  };
  private dependencyResolver = new DependencyResolver<TServices>();
  private loadedServices: LoadedService = {};

  /**
   * Initializes the ServiceManager with the provided configuration.
   * @param config - The configuration object containing service definitions.
   */
  constructor({ serviceDefinitions }: ServiceManagerConfig<TServices>) {
    this.dependencyResolver.serviceDefinitions = serviceDefinitions;
    this.populateAvailableServiceNames(serviceDefinitions);
  }

  /**
   * Loads a service by its instance name.
   * @param serviceInstanceName - The name of the service instance to load.
   * @returns A promise that resolves to the loaded service instance.
   */
  public async loadService<K extends keyof TServices>(
    serviceInstanceName: K
  ): Promise<TServices[K]> {
    return (await this.loadServiceInternal(
      serviceInstanceName as string
    )) as TServices[K];
  }

  /**
   * Loads multiple services by their instance names.
   * @param serviceInstanceNames - An array of service instance names to load.
   * @returns A promise that resolves to an array of loaded service instances.
   */
  public async loadServices<K extends keyof TServices>(
    serviceInstanceNames: K[] = []
  ): Promise<TServices[K][]> {
    const promises = serviceInstanceNames.map((name) => this.loadService(name));
    return await Promise.all(promises);
  }

  private populateAvailableServiceNames(
    serviceDefinitions: ServiceDefinition<TServices>[]
  ) {
    this.SERVICES = {} as { [K in Extract<keyof TServices, string>]: K };
    serviceDefinitions.forEach((serviceDefinition) => {
      const serviceName =
        serviceDefinition.serviceInstanceName ??
        serviceDefinition.serviceClassName;
      this.SERVICES[serviceName as Extract<keyof TServices, string>] =
        serviceName as Extract<keyof TServices, string>;
    });
  }

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
        serviceDefinition.serviceClassName;
    }
    return await this.getInstanceInternal(
      serviceDefinition as AdaptedServiceDefinition<TServices>
    );
  }

  private async getInstanceInternal(
    serviceDefinition: AdaptedServiceDefinition<TServices>
  ): Promise<unknown> {
    if (
      !this.dependencyResolver.isModuleLoaded(
        serviceDefinition.serviceInstanceName
      )
    ) {
      await this.dependencyResolver.resolve(serviceDefinition);
    }
    const instance = await this.createInstance(serviceDefinition);
    this.loadedServices[serviceDefinition.serviceInstanceName] = instance;
    return instance;
  }

  private async createInstance(
    serviceDefinition: AdaptedServiceDefinition<TServices>
  ): Promise<unknown> {
    let injections: unknown[] = [];
    if (serviceDefinition.serviceInjections) {
      injections = await this.parseInjections(
        serviceDefinition.serviceInjections
      );
    }
    const DefinitionConstructor = this.dependencyResolver.getLoadedModule(
      serviceDefinition.serviceInstanceName
    );
    const instance = new DefinitionConstructor(...injections);
    await this.postBuildActions(
      serviceDefinition,
      instance as Record<string, unknown>
    );
    this.dependencyResolver.deleteModulePromise(
      serviceDefinition.serviceInstanceName
    );
    return instance;
  }

  private async parseInjections(
    injections: ServiceInjection<TServices>[]
  ): Promise<unknown[]> {
    const loadedInjections: unknown[] = [];
    for (const injection of injections) {
      let loadedInjection = undefined;
      if (this.isServiceInstanceInjection(injection)) {
        loadedInjection = await this.loadService(
          injection.serviceInstanceName as keyof TServices
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

  private isServiceInstanceInjection(
    injection: ServiceInjection<TServices>
  ): injection is { serviceInstanceName: Extract<keyof TServices, string> } {
    return 'serviceInstanceName' in injection;
  }

  private isCustomInjection(
    injection: ServiceInjection<TServices>
  ): injection is { customInjection: unknown } {
    return 'customInjection' in injection;
  }

  private async postBuildActions(
    serviceDefinition: AdaptedServiceDefinition<TServices>,
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
        `Post build action "${methodName}" failed to execute in ${serviceDefinition.serviceClassName}.`
      );
    }
  }
}
