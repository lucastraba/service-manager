[**service-manager**](../README.md) • **Docs**

---

[service-manager](../README.md) / ServiceManager

# Class: ServiceManager

The ServiceManager is an IoC container.
It is responsible for loading services and their dependencies.

## Example

1. We write the classes we will use.

```ts
class MyClass {
  constructor(private readonly myDependency: MyDependency) {}
}
class MyDependency {}
```

2. If available, we add it to the declaration file, so that [ServiceManager.SERVICES](ServiceManager.md#services) can auto-complete.

```ts
// service-manager.d.ts
declare module '@helu/core' {
  interface ServiceManager {
    MyClass: 'MyClass';
    MyDependency: 'MyDependency';
  }
}
```

3. We create a definitions file. If the project has set an auto-importing mechanism,
   make sure that the file is named '\*.definition.ts' or whatever naming convention you
   have defined for the auto-importing.
   Here, we define a group of [ServiceDefinition](../type-aliases/ServiceDefinition.md) objects.

```ts
// myDomain.definition.ts
const definitions: ServiceDefinition[] = [
  {
    serviceClassName: ServiceManager.SERVICES.MyClass,
    serviceInjections: [
      {
        serviceInstanceName: ServiceManager.SERVICES.MyDependency,
      },
    ],
    pathToService: async () => import('./MyClass'),
  },
  {
    serviceClassName: ServiceManager.SERVICES.MyDependency,
    pathToService: async () => import('./MyDependency'),
  },
];

export default definitions;
```

4. We use it with [ServiceManager.loadService](ServiceManager.md#loadservice)

```ts
// myFunctionality.ts
const myCoolService = ServiceManager.loadService(
  ServiceManager.SERVICES.MyClass
) as MyClass;
```

## Constructors

### new ServiceManager()

> **new ServiceManager**(): [`ServiceManager`](ServiceManager.md)

#### Returns

[`ServiceManager`](ServiceManager.md)

## Properties

### SERVICES

> `static` **SERVICES**: `Record`\<`string`, `string`\> = `{}`

A services map, where both the key and the value is the service instance name
(or the service class name, if the instance name is not defined).

This can be extended by the user creating a declaration file with the following content:

```ts
declare module '@helu/core' {
  interface ServiceManager {
    MyService: 'MyService';
  }
}
```

#### Defined in

src/serviceManager/ServiceManager.ts:85

## Methods

### initialize()

> `static` **initialize**(`config`): `Promise`\<`void`\>

Initialize the service manager.

#### Parameters

• **config**: [`ServiceManagerConfig`](../type-aliases/ServiceManagerConfig.md)

The configuration object.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the service manager is initialized.

See [ServiceManagerConfig](../type-aliases/ServiceManagerConfig.md) for initialization examples.

#### Defined in

src/serviceManager/ServiceManager.ts:99

---

### loadService()

> `static` **loadService**(`serviceInstanceName`): `Promise`\<`unknown`\>

Load a service.
This will load the service and all its dependencies, recursively.
If the service is already loaded, it will return the existing instance.
If the service is not found, it will throw an error.
If the service has a post build action, it will execute it.

#### Parameters

• **serviceInstanceName**: `string`

The instance name of the service to load.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves with the service instance.

#### Throws

`DefinitionNotFoundError` if ServiceDefinition.serviceClassName or ServiceDefinition.serviceInstanceName are not found.

#### Throws

`InvalidInjectionError` if ServiceDefinition.serviceInjections does not have the required keys. This case cannot be reached using Typescript.

#### Throws

`InvalidPostBuildActionError` if one or more of the methods specified in ServiceDefinition.pathToService is not valid.

#### Throws

`InvalidPathError` if ServiceDefinition.pathToService is invalid.

#### Throws

`PathNotFoundError` if ServiceDefinition.pathToService can't be found.

#### Example

```ts
(await ServiceManager.loadService('myService')) as MyService;
```

#### Defined in

src/serviceManager/ServiceManager.ts:137

---

### loadServices()

> `static` **loadServices**(`serviceInstanceNames`): `Promise`\<`unknown`[]\>

Load multiple services in parallel.
This will load the services and all their dependencies, recursively.
The order of the services in the returned array will match the order of the instance names in the input array.
Internally, this uses [ServiceManager.loadService](ServiceManager.md#loadservice). See its documentation for more details.

#### Parameters

• **serviceInstanceNames**: `string`[] = `[]`

An array with the instance names of the services to load.

#### Returns

`Promise`\<`unknown`[]\>

A promise that resolves with an array of the service instances.

#### Example

```ts
const [myService, myOtherService] = (await ServiceManager.loadServices([
  'myService',
  'myOtherService',
])) as [MyService, MyOtherService];
```

#### Defined in

src/serviceManager/ServiceManager.ts:158

---

### reset()

> `static` **reset**(): `void`

Reset the service manager.
This is useful for testing purposes, or if you want to re-initialize the service manager.

#### Returns

`void`

#### Defined in

src/serviceManager/ServiceManager.ts:111
