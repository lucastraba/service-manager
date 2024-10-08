[**@lucastraba/service-manager**](../README.md) • **Docs**

***

[@lucastraba/service-manager](../globals.md) / ServiceDefinition

# Type Alias: ServiceDefinition\<TServices, TInstances\>

> **ServiceDefinition**\<`TServices`, `TInstances`\>: `object`

Defines a service. A service has a class name, optionally an instance name, optionally a list of service injections,
optionally a list of post-build asynchronous actions, and a path to the service, so that the service can be loaded asynchronously.

## Type Parameters

• **TServices** *extends* `ServiceMap`

• **TInstances** *extends* `ServiceMap` = `TServices`

## Type declaration

### pathToService()

> **pathToService**: () => `Promise`\<[`ModuleWithDefaultExport`](../-internal-/type-aliases/ModuleWithDefaultExport.md)\<`TServices`\[keyof `TServices`\]\>\>

A function that returns a promise resolving to the service.

#### Returns

`Promise`\<[`ModuleWithDefaultExport`](../-internal-/type-aliases/ModuleWithDefaultExport.md)\<`TServices`\[keyof `TServices`\]\>\>

### postBuildAsyncActions?

> `optional` **postBuildAsyncActions**: `string`[]

An array of post-build asynchronous actions. Optional.

### serviceClassName

> **serviceClassName**: keyof `TServices`

The class name of the service.

### serviceInjections?

> `optional` **serviceInjections**: [`ServiceInjection`](../-internal-/type-aliases/ServiceInjection.md)\<`TServices`, `TInstances`\>[]

An array of service injections. Optional.

### serviceInstanceName?

> `optional` **serviceInstanceName**: keyof `TInstances`

The instance name of the service. If not provided, the `serviceClassName` will be used.

## Defined in

[service-manager/service-manager.type.ts:17](https://github.com/lucastraba/service-manager/blob/1f568d8fa4f03055a4ed0e484704c9985f8f7f13/src/service-manager/service-manager.type.ts#L17)
