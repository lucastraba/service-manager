[**service-manager**](../README.md) • **Docs**

---

[service-manager](../README.md) / ServiceManagerConfig

# Type Alias: ServiceManagerConfig

> **ServiceManagerConfig**: `object`

Configuration object for the initialization of the ServiceManager.

## Type declaration

### serviceDefinitions

> **serviceDefinitions**: [`ServiceDefinition`](ServiceDefinition.md)[]

The service definitions that will be available for the loading of the services.

#### Remarks

If you want to load the services automatically, you can use `import.glob.meta`.
Use the following snippet (asterisks have been escaped with [] due to limitations of Typedoc):

```ts
const serviceDefinitions = [];
const definitionFiles = import.meta.glob<{ default: ServiceDefinition[] }>(
  `src/[**]/[*].definitions.ts`
);
for (const path in definitionFiles) {
  const { default: definition } = await definitionFiles[path]();
  serviceDefinitions.push(...definition);
}
```

This will collect all the definitions from the `src` folder and its sub-folders.

## Defined in

src/serviceManager/services.type.ts:4
