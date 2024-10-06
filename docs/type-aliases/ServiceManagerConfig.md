[**@lucastraba/service-manager**](../README.md) • **Docs**

---

[@lucastraba/service-manager](../globals.md) / ServiceManagerConfig

# Type Alias: ServiceManagerConfig\<TServices, TInstances\>

> **ServiceManagerConfig**\<`TServices`, `TInstances`\>: `object`

Configuration object for the initialization of the ServiceManager.

## Type Parameters

• **TServices** _extends_ `ServiceMap`

• **TInstances** _extends_ `ServiceMap` = `TServices`

## Type declaration

### serviceDefinitions

> **serviceDefinitions**: [`ServiceDefinition`](ServiceDefinition.md)\<`TServices`, `TInstances`\>[]

The service definitions that will be available for the loading of the services.

## Defined in

[src/service-manager/services.type.ts:4](https://github.com/lucastraba/service-manager/blob/42c879c92f997e373b26f424096c7fe71fc5f9df/src/service-manager/services.type.ts#L4)
