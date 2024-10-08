[**@lucastraba/service-manager**](../README.md) • **Docs**

***

[@lucastraba/service-manager](../globals.md) / ServiceManagerConfig

# Type Alias: ServiceManagerConfig\<TServices, TInstances\>

> **ServiceManagerConfig**\<`TServices`, `TInstances`\>: `object`

Configuration object for the initialization of the ServiceManager.

## Type Parameters

• **TServices** *extends* `ServiceMap`

• **TInstances** *extends* `ServiceMap` = `TServices`

## Type declaration

### serviceDefinitions

> **serviceDefinitions**: [`ServiceDefinition`](ServiceDefinition.md)\<`TServices`, `TInstances`\>[]

The service definitions that will be available for the loading of the services.

## Defined in

[service-manager/service-manager.type.ts:5](https://github.com/lucastraba/service-manager/blob/1f568d8fa4f03055a4ed0e484704c9985f8f7f13/src/service-manager/service-manager.type.ts#L5)
