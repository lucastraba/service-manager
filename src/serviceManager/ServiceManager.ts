import { match, P } from 'ts-pattern';
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
 * // service-manager.d.ts
 * declare module '@helu/core' {
 *  interface ServiceManager {
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
export default class ServiceManager {
  /**
   * A services map, where both the key and the value is the service instance name
   * (or the service class name, if the instance name is not defined).
   *
   * This can be extended by the user creating a declaration file with the following content:
   * ```ts
   * declare module '@helu/core' {
   *  interface ServiceManager {
   *    MyService: 'MyService';
   *  }
   * }
   * ```
   * */
  public static SERVICES: Record<string, string> = {};
  /**
   * @internal
   */
  private static instance: Nullable<ServiceManager>;

  /**
   * Initialize the service manager.
   *
   * @param config - The configuration object.
   * @returns A promise that resolves when the service manager is initialized.
   *
   * See {@link ServiceManagerConfig} for initialization examples.
   */
  public static async initialize({ serviceDefinitions }: ServiceManagerConfig) {
    DependencyResolver.serviceDefinitions = serviceDefinitions;
    ServiceManager.populateAvailableServiceNames(
      DependencyResolver.serviceDefinitions
    );
    ServiceManager.getInstance();
  }

  /**
   * Reset the service manager.
   * This is useful for testing purposes, or if you want to re-initialize the service manager.
   */
  public static reset() {
    ServiceManager.instance = null;
    ServiceManager.SERVICES = {};
    DependencyResolver.serviceDefinitions = [];
  }

  /**
   * Load a service.
   * This will load the service and all its dependencies, recursively.
   * If the service is already loaded, it will return the existing instance.
   * If the service is not found, it will throw an error.
   * If the service has a post build action, it will execute it.
   *
   * @typeParam T - The type of the service that will be returned.
   * @param serviceInstanceName - The instance name of the service to load.
   * @throws `DefinitionNotFoundError` if {@link ServiceDefinition.serviceClassName} or {@link ServiceDefinition.serviceInstanceName} are not found.
   * @throws `InvalidInjectionError` if {@link ServiceDefinition.serviceInjections} does not have the required keys. This case cannot be reached using Typescript.
   * @throws `InvalidPostBuildActionError` if one or more of the methods specified in {@link ServiceDefinition.pathToService} is not valid.
   * @throws `InvalidPathError` if {@link ServiceDefinition.pathToService} is invalid.
   * @throws `PathNotFoundError` if {@link ServiceDefinition.pathToService} can't be found.
   * @returns A promise that resolves with the service instance.
   * @example
   * ```ts
   * await ServiceManager.loadService('myService') as MyService;
   * ```
   */
  public static async loadService(
    serviceInstanceName: string
  ): Promise<unknown> {
    return await ServiceManager.getInstance().loadService(serviceInstanceName);
  }

  /**
   * Load multiple services in parallel.
   * This will load the services and all their dependencies, recursively.
   * The order of the services in the returned array will match the order of the instance names in the input array.
   * Internally, this uses {@link ServiceManager.loadService}. See its documentation for more details.
   *
   * @typeParam T - An array with the types of the services that will be returned, in order.
   * @param serviceInstanceNames - An array with the instance names of the services to load.
   * @returns A promise that resolves with an array of the service instances.
   *
   * @example
   * ```ts
   * const [myService, myOtherService] = await ServiceManager.loadServices(['myService', 'myOtherService']) as [MyService, MyOtherService];
   * ```
   */
  public static async loadServices(
    serviceInstanceNames: string[] = []
  ): Promise<unknown[]> {
    return await ServiceManager.getInstance().loadServices(
      serviceInstanceNames
    );
  }

  /**
   * @internal
   */
  private static populateAvailableServiceNames(
    serviceDefinitions: ServiceDefinition[]
  ) {
    ServiceManager.SERVICES = {};
    serviceDefinitions.forEach((serviceDefinition) => {
      const serviceName =
        serviceDefinition.serviceInstanceName ??
        serviceDefinition.serviceClassName;
      ServiceManager.SERVICES[serviceName] = serviceName;
    });
  }

  /**
   * @internal
   */
  private static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * @internal
   */
  private dependencyResolver = new DependencyResolver();
  /**
   * @internal
   */
  private loadedServices: LoadedService = {};

  /**
   * @internal
   */
  private async loadService(serviceInstanceName: string): Promise<unknown> {
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
    return await this.getInstance(
      serviceDefinition as AdaptedServiceDefinition
    );
  }

  /**
   * @internal
   */
  private async loadServices(
    serviceInstanceNames: string[] = []
  ): Promise<unknown[]> {
    const promises = serviceInstanceNames.map((serviceInstanceName) =>
      this.loadService(serviceInstanceName)
    );

    return await Promise.all(promises);
  }

  /**
   * @internal
   */
  private async getInstance(
    serviceDefinition: AdaptedServiceDefinition
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

  /**
   * @internal
   */
  private async createInstance(
    serviceDefinition: AdaptedServiceDefinition
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

  /**
   * @internal
   */
  private async parseInjections(
    injections: ServiceInjection[]
  ): Promise<unknown[]> {
    const loadedInjections: unknown[] = [];
    for (const injection of injections) {
      let loadedInjection = undefined;
      await match(injection)
        .with(
          { serviceInstanceName: P.string },
          async ({ serviceInstanceName }) => {
            loadedInjection = await this.loadService(serviceInstanceName);
          }
        )
        .with({ customInjection: P.any }, ({ customInjection }) => {
          loadedInjection = customInjection as unknown;
        })
        .otherwise(() => {
          throw new InvalidInjectionError(
            `Invalid injection object: ${JSON.stringify(
              injection
            )}. Only 'serviceInstanceName' and 'customInjection' keys are allowed.`
          );
        });
      if (loadedInjection) loadedInjections.push(loadedInjection);
    }
    return loadedInjections;
  }

  /**
   * @internal
   */
  private async postBuildActions(
    serviceDefinition: AdaptedServiceDefinition,
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
