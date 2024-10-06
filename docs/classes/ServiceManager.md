[**@lucastraba/service-manager**](../README.md) • **Docs**

---

[@lucastraba/service-manager](../globals.md) / ServiceManager

# Class: ServiceManager\<TServices, TInstances\>

The ServiceManager is an IoC container.
It is responsible for loading services and their dependencies.

## Example

1. Define the classes to be used as services.

```ts
class MyClass {
  constructor(private readonly myDependency: MyDependency) {}
}
class MyDependency {}

class MySecondDependency extends MyDependency {}
```

2. Create a map type of your services. This allows the ServiceManager to infer
   the return type of the service when loading, to autocomplete the available services,
   to allow you to use the `.SERVICES` property of the ServiceManager's instance
   for even more runtime safety, and to have type safety for service definitions.

```ts
type Services = {
  MyService: MyService;
  MyDependency: MyDependency;
  MySecondDependency: MySecondDependency;
};
```

Additionally, you can define a type for your instances, if you have multiple instances of the same service.
This is only required if you have multiple instances of the same service with different injections.
Remember that the injections must have the same interface.
If you define a type for your instances, you have to pass it as the second generic to the ServiceManager,
and to the definitions type if you want the type safety.

```ts
type Instances = {
  myServiceInstance: MyClass;
  myDependencyInstance: MyDependency;
};
```

3. Create a definitions file.
   In this example, we're passing both generics.

```ts
// myDomain.definition.ts
const definitions: ServiceDefinition<Services, Instances>[] = [
  {
    serviceClassName: 'MyClass', // This will be autocompleted if you pass the first generic.
    serviceInjections: [
      { serviceInstanceName: 'MyDependency' }, // This will be autocompleted smartly if you pass one or both generics.
    ],
    pathToService: async () => import('./MyClass'), // This is used to load the service asynchronously.
  },
  {
    serviceClassName: 'MyClass', // Note that we're reusing the class name, but with different instance name.
    serviceInstanceName: 'myServiceOtherInstance', // This will be autocompleted if you pass the second generic.
    serviceInjections: [{ serviceInstanceName: 'MySecondDependency' }],
    pathToService: async () => import('./MySecondDependency'),
  },
  {
    serviceClassName: 'MyDependency',
    pathToService: async () => import('./MyDependency'),
  },
  {
    serviceClassName: 'MySecondDependency',
    pathToService: async () => import('./MySecondDependency'),
  },
];

export default definitions;
```

Note the following:

- The service instance name is optional. If not provided, the service class name will be used.
- The service instance name must be unique.
- The service class name must be unique.
- The path to the service must be a function that returns a promise.
- The path to the service must be a relative path.
- The path to the service must be a valid path.

What we're doing here is that we're creating a list of instructions for the ServiceManager.

These definitions will produce:

- A MyClass instance with a MyDependency instance injected.
- A MyClass instance with a MySecondDependency instance injected.
- A MyDependency instance.
- A MySecondDependency instance.

All these instances are singletons and will be reused by the ServiceManager
every time you call [ServiceManager.loadService](ServiceManager.md#loadservice) or [ServiceManager.loadServices](ServiceManager.md#loadservices)
on your ServiceManager instance, and the service names will be available
in the [ServiceManager.SERVICES](ServiceManager.md#services) of the instance,
in case you don't want to rely on string literals.

Additionally, if you define each class in a separate file,
the ServiceManager will be able to load them asynchronously on demand.
This is why the [ServiceManager.loadService](ServiceManager.md#loadservice) must be awaited.

4. Use with [ServiceManager.loadService](ServiceManager.md#loadservice)

```ts
// myFunctionality.ts
const myCoolService = await serviceManager.loadService('MyClass');
```

or

```ts
// myFunctionality.ts
const myCoolService = await serviceManager.loadServices([
  'MyClass',
  'myServiceOtherInstance',
]);
```

or

```ts
// myFunctionality.ts
const myCoolService = await serviceManager.loadService(
  serviceManager.SERVICES.MyClass
);
```

All of this is type safe, and the return type of the service will be correctly inferred.
Please note that if you load multiple services, you will have to check whether
the services in the array are undefined, or cast them manually.

## Type Parameters

• **TServices** _extends_ `ServiceMap`

• **TInstances** _extends_ `Record`\<`string`, `unknown`\> = `TServices`

## Constructors

### new ServiceManager()

> **new ServiceManager**\<`TServices`, `TInstances`\>(`config`): [`ServiceManager`](ServiceManager.md)\<`TServices`, `TInstances`\>

Constructs a new ServiceManager.

#### Parameters

• **config**: [`ServiceManagerConfig`](../type-aliases/ServiceManagerConfig.md)\<`TServices`, `TInstances`\>

The configuration object containing service definitions.

#### Returns

[`ServiceManager`](ServiceManager.md)\<`TServices`, `TInstances`\>

#### Defined in

[src/service-manager/ServiceManager.ts:153](https://github.com/lucastraba/service-manager/blob/42c879c92f997e373b26f424096c7fe71fc5f9df/src/service-manager/ServiceManager.ts#L153)

## Properties

### SERVICES

> **SERVICES**: \{ \[K in string \| number \| symbol\]: K \}

A map of service names, where both the key and the value are the service instance name
or the service class name if the instance name is not defined.

#### Defined in

[src/service-manager/ServiceManager.ts:139](https://github.com/lucastraba/service-manager/blob/42c879c92f997e373b26f424096c7fe71fc5f9df/src/service-manager/ServiceManager.ts#L139)

## Methods

### loadService()

> **loadService**\<`K`\>(`serviceInstanceName`): `Promise`\<`TServices` & `TInstances`\[`K`\]\>

Loads a service by its instance name.

#### Type Parameters

• **K** _extends_ `string` \| `number` \| `symbol`

#### Parameters

• **serviceInstanceName**: `K`

The name of the service instance to load.

#### Returns

`Promise`\<`TServices` & `TInstances`\[`K`\]\>

A promise that resolves with the service instance.

#### Defined in

[src/service-manager/ServiceManager.ts:166](https://github.com/lucastraba/service-manager/blob/42c879c92f997e373b26f424096c7fe71fc5f9df/src/service-manager/ServiceManager.ts#L166)

---

### loadServices()

> **loadServices**\<`K`\>(`serviceInstanceNames`): `Promise`\<`TServices` & `TInstances`\[`K`\][]\>

Loads multiple services in parallel.

#### Type Parameters

• **K** _extends_ `string` \| `number` \| `symbol`

#### Parameters

• **serviceInstanceNames**: `K`[] = `[]`

An array of service instance names to load.

#### Returns

`Promise`\<`TServices` & `TInstances`\[`K`\][]\>

A promise that resolves with an array of service instances.

#### Defined in

[src/service-manager/ServiceManager.ts:180](https://github.com/lucastraba/service-manager/blob/42c879c92f997e373b26f424096c7fe71fc5f9df/src/service-manager/ServiceManager.ts#L180)
