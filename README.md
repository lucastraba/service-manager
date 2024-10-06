# Service Manager

A lightweight IoC container for managing services and their dependencies.

## Features

- Define services and their dependencies using a simple configuration object
- Automatically load services and inject dependencies
- Perform post-build asynchronous actions on services
- Supports multiple instances of the same service with different injections
- Lightweight and easy to use

## Installation

```bash
pnpm add @lucastraba/service-manager
```

## Usage

1. Define your services and their dependencies in a definitions file:

   ```typescript
   // myDomain.definition.ts
   import { ServiceDefinition } from '@your-org/service-manager';
   const definitions: ServiceDefinition[] = [
     {
       serviceClassName: 'MyService',
       serviceInjections: [
         {
           serviceInstanceName: 'MyDependency',
         },
       ],
       pathToService: async () => import('./MyService'),
     },
     {
       serviceClassName: 'MyDependency',
       pathToService: async () => import('./MyDependency'),
     },
   ];
   export default definitions;
   ```

2. Initialize the ServiceManager with your service definitions:

   ```typescript
   import { ServiceManager } from '@lucastraba/service-manager';
   const serviceDefinitions = [];
   const definitionFiles = import.meta.glob<{ default: ServiceDefinition[]; }>(src/**/*.definitions.ts);
   for (const path in definitionFiles) {
       const { default: definition } = await definitionFiles[path];
       serviceDefinitions.push(...definition);
   }
   await ServiceManager.initialize({ serviceDefinitions });
   ```

3. Load and use your services:

```typescript
const myService = ServiceManager.loadService('MyService');
```

## API Documentation

For detailed API documentation, please see the [TypeDoc README](docs/README.md).

## Contributing

Contributions are welcome! Please see the [contributing guide](CONTRIBUTING.md)
for more information.

## License

This project is licensed under the [MIT License](LICENSE).
