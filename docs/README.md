**@lucastraba/service-manager** • [**Docs**](globals.md)

---

# Service Manager

The Service Manager is a simple schema-based IoC (Inversion of Control) container for TypeScript.
It provides a way to manage dependencies and services in your application,
making it easier to write modular, testable, and maintainable code.

## Features

- **Dependency Injection Made Easy**: The Service Manager automatically resolves
  and injects dependencies based on simple service definition schemas
- **Instance Management**: Swap injections and arguments easily
  by defining them in the service definition schema
- **Singletons galore**: All your services will be singletons,
  no need to worry about misplacing your state
- **Post-build Actions**: Define your initialization actions directly
  in the schema
- **Lazy Loading**: Service modules are imported asynchronously on-demand
- **Type Safety**: The Service Manager has been meticulously developed
  to ensure maximum type safety and autocompletion
- **Lightweight:** Did you know the Service Manager weighs only 6 kB gzipped? It's true!
- **Zero Dependencies:** The Service Manager has no dependencies,
  so you can expect it to work even if all other libraries collapse

## Getting Started

1. Install the Service Manager package:

   - Using npm

   ```bash
   npm install service-manager
   ```

   - Using pnpm

   ```bash
   pnpm add service-manager
   ```

   - Using yarn

   ```bash
   yarn add service-manager
   ```

2. Define your service classes:

   ```typescript
   // MyService.ts
   export default class MyService {
     constructor(private readonly myDependency: MyDependency) {}

     // Service methods...
   }

   // MyDependency.ts
   export default class MyDependency {
     // Dependency methods...
   }

   // MySecondDependency.ts
   export default class MySecondDependency {
     // Dependency methods...
   }
   ```

3. Create a map of your services and instances
   (if you need multiple instances of the same service):

   ```typescript
   // services.type.ts
   export type Services = {
     MyService: MyService;
     MyDependency: MyDependency;
     MySecondDependency: MySecondDependency;
   };
   export type Instances = {
     myOtherServiceInstance: MyService;
   };
   ```

4. Create a service definition file:

   ```typescript
   // serviceDefinitions.ts
   import type { ServiceDefinition } from 'service-manager';
   import type { Services, Instances } from './services.type';

   const serviceDefinitions: ServiceDefinition<Services, Instances>[] = [
     {
       serviceClassName: 'MyService',
       serviceInjections: [{ serviceInstanceName: 'MyDependency' }],
       pathToService: async () => import('./MyService'),
     },
     {
       serviceClassName: 'MyDependency',
       pathToService: async () => import('./MyDependency'),
     },
     {
       serviceClassName: 'MySecondDependency',
       pathToService: async () => import('./MySecondDependency'),
     },
     {
       serviceClassName: 'MyService',
       serviceInstanceName: 'myOtherServiceInstance',
       serviceInjections: [{ serviceInstanceName: 'MySecondDependency' }],
       pathToService: async () => import('./MyService'),
     },
   ];

   export default serviceDefinitions;
   ```

5. Initialize the Service Manager:

   ```typescript
   // index.ts
   import { ServiceManager } from 'service-manager';
   import serviceDefinitions from './serviceDefinitions';

   const serviceManager = new ServiceManager<Services, Instances>({
     serviceDefinitions,
   });
   ```

6. Load and use services:

   ```typescript
   // index.ts
   async function main() {
     const myService = await serviceManager.loadService('MyService');
     // Use myService...
     const myServiceInstance = await serviceManager.loadService(
       serviceManager.SERVICES.myServiceInstance
     );
     // Use myServiceInstance...
     const [myDependency, mySecondDependency] =
       await serviceManager.loadServices([
         'MyDependency',
         'MySecondDependency',
       ]);
     // Use myDependency and mySecondDependency...
   }

   main();
   ```

## Additional Information and Examples

For additional information and examples,
please refer to the ServiceManager class [TSDocs](_media/ServiceManager.md) section.

## API Reference

For more information about the API, you can check
the [TSDocs](_media/globals.md) section.

## Contributing

Contributions are welcome! If you find any issues or have suggestions
for improvement, please open an issue or submit a pull request
on the [GitHub repository](https://github.com/lucastraba/service-manager).

## License

This project is licensed under
the [MIT License](https://opensource.org/licenses/MIT) © [Lucas Traba](https://github.com/lucastraba).
