import { InvalidPathError, PathNotFoundError } from './serviceManager.error';
import type {
  AdaptedServiceDefinition,
  ServiceDefinition,
} from './services.type';

/**
 * @internal
 */
export default class DependencyResolver {
  public static serviceDefinitions: ServiceDefinition[] = [];

  private loadedServiceModules: Record<string, Constructible> = {};
  private serviceModulePromises: Record<string, Promise<Constructible>> = {};

  public async resolve(
    serviceDefinition: AdaptedServiceDefinition
  ): Promise<void> {
    const unloadedModuleNames =
      this.getUnloadedInjectionNames(serviceDefinition);
    unloadedModuleNames.push(serviceDefinition.serviceInstanceName);
    await this.loadDependencies(unloadedModuleNames);
  }

  public getServiceDefinition(
    serviceInstanceName: string
  ): Nullable<ServiceDefinition> {
    return (
      DependencyResolver.serviceDefinitions.find(
        (element: ServiceDefinition) =>
          element.serviceInstanceName
            ? element.serviceInstanceName === serviceInstanceName
            : element.serviceClassName === serviceInstanceName
      ) ?? null
    );
  }

  public isModuleLoaded(serviceInstanceName: string): boolean {
    return !!this.getLoadedModule(serviceInstanceName);
  }

  public getLoadedModule(serviceInstanceName: string): Constructible {
    return this.loadedServiceModules[serviceInstanceName] as Constructible;
  }

  public deleteModulePromise(serviceInstanceName: string): void {
    delete this.serviceModulePromises[serviceInstanceName];
  }

  private getUnloadedInjectionNames(
    serviceDefinition: Nullable<ServiceDefinition>
  ): string[] {
    const unloadedInjectionNames: string[] = [];
    if (!serviceDefinition?.serviceInjections) return unloadedInjectionNames;
    for (const serviceInjection of serviceDefinition.serviceInjections) {
      if (!('serviceInstanceName' in serviceInjection)) continue;
      const injectionInstanceName = serviceInjection.serviceInstanceName;
      if (this.isModuleLoaded(injectionInstanceName)) continue;
      const childServiceDefinition = this.getServiceDefinition(
        injectionInstanceName
      );
      const subInjections = this.getUnloadedInjectionNames(
        childServiceDefinition
      );
      unloadedInjectionNames.push(injectionInstanceName, ...subInjections);
    }
    return unloadedInjectionNames;
  }

  private async loadDependencies(dependencyNames: string[]): Promise<void> {
    const promises: Promise<unknown>[] = [];
    for (const dependencyName of dependencyNames) {
      if (!this.serviceModulePromises[dependencyName]) {
        this.serviceModulePromises[dependencyName] =
          this.loadDependency(dependencyName);
      }
      promises.push(
        this.serviceModulePromises[dependencyName] as Promise<Constructible>
      );
    }
    await Promise.all(promises);
  }

  private async loadDependency(dependencyName: string): Promise<Constructible> {
    const serviceDefinition = this.getServiceDefinition(dependencyName);
    let serviceClassModule: MaybeNullable<ModuleWithDefaultExport>;
    try {
      serviceClassModule = await this.importServiceFromPath(serviceDefinition);
    } catch (_err) {
      throw new InvalidPathError(
        `The module for "${dependencyName}" could not be loaded because the path is invalid.`
      );
    }
    if (serviceClassModule == null) {
      throw new PathNotFoundError(
        `The path specified in the service definition for "${dependencyName}" could not be resolved.`
      );
    }
    const serviceClass = serviceClassModule.default;
    this.loadedServiceModules[dependencyName] = serviceClass;
    return serviceClass;
  }

  private importServiceFromPath(
    serviceDefinition: Nullable<ServiceDefinition>
  ): Nullable<Promise<ModuleWithDefaultExport>> {
    if (!serviceDefinition || !serviceDefinition.pathToService) {
      return null;
    }
    return serviceDefinition.pathToService();
  }
}
