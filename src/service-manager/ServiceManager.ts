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
 */
export default class ServiceManager<
  TServices extends ServiceMap,
  TInstances extends Record<string, unknown> = Record<string, unknown>,
> {
  public SERVICES: {
    [K in keyof (TServices & TInstances)]: K;
  } = {} as {
    [K in keyof (TServices & TInstances)]: K;
  };
  private dependencyResolver = new DependencyResolver<TServices, TInstances>();
  private loadedServices: LoadedService = {};

  constructor({
    serviceDefinitions,
  }: ServiceManagerConfig<TServices, TInstances>) {
    this.dependencyResolver.serviceDefinitions = serviceDefinitions;
    this.populateAvailableServiceNames(serviceDefinitions);
  }

  public async loadService<K extends keyof (TServices & TInstances)>(
    serviceInstanceName: K
  ): Promise<(TServices & TInstances)[K]> {
    return (await this.loadServiceInternal(
      serviceInstanceName as string
    )) as (TServices & TInstances)[K];
  }

  public async loadServices<K extends keyof (TServices & TInstances)>(
    serviceInstanceNames: K[] = []
  ): Promise<(TServices & TInstances)[K][]> {
    const promises = serviceInstanceNames.map((name) => this.loadService(name));
    return await Promise.all(promises);
  }

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

  private async createInstance(
    serviceDefinition: AdaptedServiceDefinition<TServices, TInstances>
  ): Promise<unknown> {
    let injections: unknown[] = [];
    if (serviceDefinition.serviceInjections) {
      injections = await this.parseInjections(
        serviceDefinition.serviceInjections
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

  private isServiceInstanceInjection(
    injection: ServiceInjection<TInstances>
  ): injection is { serviceInstanceName: Extract<keyof TInstances, string> } {
    return 'serviceInstanceName' in injection;
  }

  private isCustomInjection(
    injection: ServiceInjection<TInstances>
  ): injection is { customInjection: unknown } {
    return 'customInjection' in injection;
  }

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
