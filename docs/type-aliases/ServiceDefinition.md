[**service-manager**](../README.md) • **Docs**

---

[service-manager](../README.md) / ServiceDefinition

# Type Alias: ServiceDefinition

> **ServiceDefinition**: `object`

Defines a service. A service has a class name, optionally an instance name, optionally a list of service injections,
optionally a list of post-build asynchronous actions, and a path to the service.

## Type declaration

### pathToService()

> **pathToService**: () => `Promise`\<[`ModuleWithDefaultExport`](../-internal-/type-aliases/ModuleWithDefaultExport.md)\>

A function that returns a promise resolving to the service

#### Returns

`Promise`\<[`ModuleWithDefaultExport`](../-internal-/type-aliases/ModuleWithDefaultExport.md)\>

### postBuildAsyncActions?

> `optional` **postBuildAsyncActions**: `string`[]

An array of post-build asynchronous actions. Optional.
Use this option if you want to perform some asynchronous actions after the service has been built.
If the actions are not asynchronous, it is recommended that you perform them in the constructor
of your service instead.

### serviceClassName

> **serviceClassName**: `string`

The class name of the service. This must match exactly with the name of your service's class.

### serviceInjections?

> `optional` **serviceInjections**: [`ServiceInjection`](ServiceInjection.md)[]

An array of service injections. Optional.

### serviceInstanceName?

> `optional` **serviceInstanceName**: `string`

The instance name of the service. If not provided, the `serviceClassName` will be used.
This option is useful if you want to have multiple instances of the same service but with different
injections. The only requirement is that the injections share the same interface.

## Defined in

src/serviceManager/services.type.ts:26
