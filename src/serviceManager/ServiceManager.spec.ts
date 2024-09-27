import DependencyResolver from './DependencyResolver';
import ServiceManager from './ServiceManager';
import {
  DefinitionNotFoundError,
  InvalidInjectionError,
  InvalidPathError,
  InvalidPostBuildActionError,
  PathNotFoundError,
} from './serviceManager.error';
import { ServiceDefinition } from './services.type';

vi.mock('./utils/serviceManager.utils.ts');

const injectionValueAlpha = 'some value';
const injectionValueBeta = 'some other value';
const dependencyReturnValueAlpha = 1;
const dependencyReturnValueBeta = 2;
const mockPostBuildAction = vi.fn();
const instantiationSpy = vi.fn();

class MyServiceClassSimple {
  async postBuildMethod() {
    await mockPostBuildAction();
  }
}

class MyServiceClassInjection {
  constructor(
    private readonly _myDependencyClass: MyDependencyAlphaClass,
    private readonly _myValue: string
  ) {}

  getInjectionValue() {
    return this._myValue;
  }

  callDependencyMethod() {
    return this._myDependencyClass.dependencyMethod();
  }

  async postBuildMethod() {
    mockPostBuildAction();
  }
}

class MyServiceClassInjectionInvertedArgs {
  constructor(
    private readonly _myValue: string,
    private readonly _myDependencyClass: MyDependencyAlphaClass
  ) {}

  getInjectionValue() {
    return this._myValue;
  }

  callDependencyMethod() {
    return this._myDependencyClass.dependencyMethod();
  }
}

class MyDependencyAlphaClass {
  constructor() {
    instantiationSpy();
  }

  dependencyMethod() {
    return dependencyReturnValueAlpha;
  }
}

class MyDependencyBetaClass {
  dependencyMethod() {
    return dependencyReturnValueBeta;
  }
}

const simpleServicePathMock = vi
  .fn()
  .mockResolvedValue({ default: MyServiceClassSimple });
const injectedServicePathMock = vi
  .fn()
  .mockResolvedValue({ default: MyServiceClassInjection });
const invertedInjectionServicePathMock = vi
  .fn()
  .mockResolvedValue({ default: MyServiceClassInjectionInvertedArgs });
const dependencyAlphaPathMock = vi
  .fn()
  .mockResolvedValue({ default: MyDependencyAlphaClass });
const dependencyBetaPathMock = vi
  .fn()
  .mockResolvedValue({ default: MyDependencyBetaClass });

const serviceDefinitionMocks = {
  onlyRequiredProperties: {
    serviceClassName: 'MyServiceClassSimple',
    pathToService: simpleServicePathMock,
  } as ServiceDefinition,
  withServiceInstanceName: {
    serviceInstanceName: 'myService',
    serviceClassName: 'MyServiceClassSimple',
    pathToService: simpleServicePathMock,
  } as ServiceDefinition,
  withServiceInjections: {
    serviceClassName: 'MyServiceClassInjection',
    serviceInjections: [
      { serviceInstanceName: 'MyDependencyAlphaClass' },
      { customInjection: injectionValueAlpha },
    ],
    pathToService: injectedServicePathMock,
  } as ServiceDefinition,
  withInvertedServiceInjections: {
    serviceClassName: 'MyServiceClassInjectionInvertedArgs',
    serviceInjections: [
      { customInjection: injectionValueAlpha },
      { serviceInstanceName: 'MyDependencyAlphaClass' },
    ],
    pathToService: invertedInjectionServicePathMock,
  } as ServiceDefinition,
  withAllProperties: {
    serviceInstanceName: 'myService',
    serviceClassName: 'MyServiceClassInjection',
    serviceInjections: [
      { serviceInstanceName: 'MyDependencyAlphaClass' },
      { customInjection: injectionValueAlpha },
    ],
    postBuildAsyncActions: ['postBuildMethod'],
    pathToService: injectedServicePathMock,
  } as ServiceDefinition,
  withServiceDifferentInstanceName: {
    serviceInstanceName: 'myOtherService',
    serviceClassName: 'MyServiceClassInjection',
    serviceInjections: [
      { serviceInstanceName: 'MyDependencyBetaClass' },
      { customInjection: injectionValueBeta },
    ],
    pathToService: injectedServicePathMock,
  } as ServiceDefinition,
  withPostBuildAction: {
    serviceClassName: 'MyServiceClassSimple',
    postBuildAsyncActions: ['postBuildMethod'],
    pathToService: simpleServicePathMock,
  } as ServiceDefinition,
  withInvalidPostBuildAction: {
    serviceClassName: 'MyServiceClassSimple',
    postBuildAsyncActions: ['nonExistentMethod'],
    pathToService: simpleServicePathMock,
  } as ServiceDefinition,
  withInvalidInjectionKey: {
    serviceClassName: 'InvalidInjection',
    serviceInjections: [{ invalid: '' }],
    pathToService: simpleServicePathMock,
  } as never,
  withNotFoundPath: {
    serviceClassName: 'MyServiceClassSimple',
    postBuildAsyncActions: ['nonExistentMethod'],
    pathToService: null,
  } as never,
  withInvalidPath: {
    serviceClassName: 'MyServiceClassSimple',
    postBuildAsyncActions: ['nonExistentMethod'],
    pathToService: vi.fn().mockRejectedValue('error'),
  } as ServiceDefinition,
  dependencyDefinitionAlpha: {
    serviceClassName: 'MyDependencyAlphaClass',
    pathToService: dependencyAlphaPathMock,
  } as ServiceDefinition,
  dependencyDefinitionBeta: {
    serviceClassName: 'MyDependencyBetaClass',
    pathToService: dependencyBetaPathMock,
  } as ServiceDefinition,
};

describe('ServiceManager', () => {
  beforeEach(async () => {
    ServiceManager.reset();
    vi.clearAllMocks();
  });
  describe('initialize', () => {
    it('initializes with definitions', async () => {
      // Arrange.
      // Act.
      await ServiceManager.initialize({
        serviceDefinitions: [
          serviceDefinitionMocks.onlyRequiredProperties,
          serviceDefinitionMocks.dependencyDefinitionAlpha,
        ],
      });
      // Assert.
      expect(DependencyResolver.serviceDefinitions).toStrictEqual([
        serviceDefinitionMocks.onlyRequiredProperties,
        serviceDefinitionMocks.dependencyDefinitionAlpha,
      ]);
    });
    it('populates the services object', async () => {
      // Arrange.
      // Act.
      await ServiceManager.initialize({
        serviceDefinitions: [
          serviceDefinitionMocks.onlyRequiredProperties,
          serviceDefinitionMocks.withServiceInstanceName,
        ],
      });
      // Assert.
      expect(ServiceManager.SERVICES).toStrictEqual({
        MyServiceClassSimple: 'MyServiceClassSimple',
        myService: 'myService',
      });
    });
  });
  describe('loadService', () => {
    it('successfully loads a simple service', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [serviceDefinitionMocks.onlyRequiredProperties],
      });
      // Act.
      const myService = (await ServiceManager.loadService(
        'MyServiceClassSimple'
      )) as MyServiceClassSimple;
      // Assert.
      expect(myService).toBeInstanceOf(MyServiceClassSimple);
    });
    it('successfully loads a simple service, even if the instance was deleted', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [serviceDefinitionMocks.onlyRequiredProperties],
      });
      ServiceManager['instance'] = null;
      // Act.
      const myService = (await ServiceManager.loadService(
        'MyServiceClassSimple'
      )) as MyServiceClassSimple;
      // Assert.
      expect(myService).toBeInstanceOf(MyServiceClassSimple);
    });
    it('successfully loads a service with injections', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [
          serviceDefinitionMocks.withServiceInjections,
          serviceDefinitionMocks.dependencyDefinitionAlpha,
        ],
      });
      // Act.
      const myService = (await ServiceManager.loadService(
        'MyServiceClassInjection'
      )) as MyServiceClassInjection;
      // Assert.
      expect(myService).toBeInstanceOf(MyServiceClassInjection);
      expect(myService.callDependencyMethod()).toBe(dependencyReturnValueAlpha);
      expect(myService.getInjectionValue()).toBe(injectionValueAlpha);
    });
    it('successfully loads a service with inverted injections', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [
          serviceDefinitionMocks.withInvertedServiceInjections,
          serviceDefinitionMocks.dependencyDefinitionAlpha,
        ],
      });
      // Act.
      const myService = (await ServiceManager.loadService(
        'MyServiceClassInjectionInvertedArgs'
      )) as MyServiceClassInjectionInvertedArgs;
      // Assert.
      expect(myService).toBeInstanceOf(MyServiceClassInjectionInvertedArgs);
      expect(myService.callDependencyMethod()).toBe(dependencyReturnValueAlpha);
      expect(myService.getInjectionValue()).toBe(injectionValueAlpha);
    });
    it('successfully loads a service with different instance name', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [
          serviceDefinitionMocks.withAllProperties,
          serviceDefinitionMocks.withServiceDifferentInstanceName,
          serviceDefinitionMocks.dependencyDefinitionAlpha,
          serviceDefinitionMocks.dependencyDefinitionBeta,
        ],
      });
      // Act.
      const myService = (await ServiceManager.loadService(
        'myService'
      )) as MyServiceClassInjection;
      const myOtherService = (await ServiceManager.loadService(
        'myOtherService'
      )) as MyServiceClassInjection;
      // Assert.
      expect(myService).toBeInstanceOf(MyServiceClassInjection);
      expect(myOtherService).toBeInstanceOf(MyServiceClassInjection);
      expect(myService.callDependencyMethod()).toBe(dependencyReturnValueAlpha);
      expect(myOtherService.callDependencyMethod()).toBe(
        dependencyReturnValueBeta
      );
      expect(myService.getInjectionValue()).toBe(injectionValueAlpha);
      expect(myOtherService.getInjectionValue()).toBe(injectionValueBeta);
    });
    it('successfully loads a service with post build action', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [serviceDefinitionMocks.withPostBuildAction],
      });
      // Act.
      const myService = (await ServiceManager.loadService(
        'MyServiceClassSimple'
      )) as MyServiceClassSimple;
      // Assert.
      expect(myService).toBeInstanceOf(MyServiceClassSimple);
      expect(mockPostBuildAction).toHaveBeenCalledOnce();
    });
    it('instantiates a service only once', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [
          serviceDefinitionMocks.withServiceInjections,
          serviceDefinitionMocks.dependencyDefinitionAlpha,
        ],
      });
      // Act.
      await ServiceManager.loadService('MyDependencyAlphaClass');
      await ServiceManager.loadService('MyServiceClassInjection');
      // Assert.
      expect(instantiationSpy).toHaveBeenCalledOnce();
    });
    it('throws an error if service definition is not found', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [],
      });
      let error: Maybe<DefinitionNotFoundError>;
      // Act.
      try {
        await ServiceManager.loadService('InvalidService');
      } catch (err) {
        error = err as DefinitionNotFoundError;
      }
      // Assert.
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(DefinitionNotFoundError);
      expect((error as DefinitionNotFoundError).message).toBe(
        'Could not find service definition for instance name "InvalidService".'
      );
    });
    it('throws an error if injection is invalid (only possible outside Typescript)', async () => {
      // Arrange.
      let error: Maybe<InvalidInjectionError>;
      await ServiceManager.initialize({
        serviceDefinitions: [serviceDefinitionMocks.withInvalidInjectionKey],
      });
      // Act
      try {
        await ServiceManager.loadService('InvalidInjection');
      } catch (err) {
        error = err as DefinitionNotFoundError;
      }
      // Assert.
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(InvalidInjectionError);
      expect((error as DefinitionNotFoundError).message).toBe(
        'Invalid injection object: {"invalid":""}. Only \'serviceInstanceName\' and \'customInjection\' keys are allowed.'
      );
    });
    it('throws an error if post build action fails', async () => {
      // Arrange.
      let error: Maybe<InvalidPostBuildActionError>;
      await ServiceManager.initialize({
        serviceDefinitions: [serviceDefinitionMocks.withInvalidPostBuildAction],
      });
      // Act
      try {
        await ServiceManager.loadService('MyServiceClassSimple');
      } catch (err) {
        error = err as InvalidPostBuildActionError;
      }
      // Assert.
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(InvalidPostBuildActionError);
      expect((error as InvalidPostBuildActionError).message).toBe(
        'Post build action "nonExistentMethod" failed to execute in MyServiceClassSimple.'
      );
    });
    it('throws an error if the pathToService is not found', async () => {
      // Arrange.
      let error: Maybe<PathNotFoundError>;
      await ServiceManager.initialize({
        serviceDefinitions: [serviceDefinitionMocks.withNotFoundPath],
      });
      // Act
      try {
        await ServiceManager.loadService('MyServiceClassSimple');
      } catch (err) {
        error = err as PathNotFoundError;
      }
      // Assert.
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(PathNotFoundError);
      expect((error as PathNotFoundError).message).toBe(
        'The path specified in the service definition for "MyServiceClassSimple" could not be resolved.'
      );
    });
    it('throws an error if the pathToService cannot be resolved', async () => {
      // Arrange.
      let error: Maybe<InvalidPathError>;
      await ServiceManager.initialize({
        serviceDefinitions: [serviceDefinitionMocks.withInvalidPath],
      });
      // Act
      try {
        await ServiceManager.loadService('MyServiceClassSimple');
      } catch (err) {
        error = err as InvalidPathError;
      }
      // Assert.
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(InvalidPathError);
      expect((error as InvalidPathError).message).toBe(
        'The module for "MyServiceClassSimple" could not be loaded because the path is invalid.'
      );
    });
  });
  describe('loadServices', () => {
    it('successfully loads multiple services', async () => {
      // Arrange.
      await ServiceManager.initialize({
        serviceDefinitions: [
          serviceDefinitionMocks.withServiceInstanceName,
          serviceDefinitionMocks.withServiceInjections,
          serviceDefinitionMocks.dependencyDefinitionAlpha,
        ],
      });
      // Act.
      const [myService, myOtherService] = (await ServiceManager.loadServices([
        'myService',
        'MyServiceClassInjection',
      ])) as [MyServiceClassSimple, MyServiceClassInjection];
      // Assert.
      expect(myService).toBeInstanceOf(MyServiceClassSimple);
      expect(myOtherService).toBeInstanceOf(MyServiceClassInjection);
      expect(myOtherService.callDependencyMethod()).toBe(
        dependencyReturnValueAlpha
      );
      expect(myOtherService.getInjectionValue()).toBe(injectionValueAlpha);
    });
  });
});
