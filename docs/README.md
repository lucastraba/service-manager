# Service Manager

The Service Manager is an IoC (Inversion of Control) container for TypeScript.
It provides a way to manage dependencies and services in your application,
making it easier to write modular, testable, and maintainable code.

## Features

- **Dependency Injection**: The Service Manager automatically resolves
  and injects dependencies for your services based on the provided service definitions.
- **Lazy Loading**: Services are loaded asynchronously on-demand,
  improving application startup time and resource usage.
- **Type Safety**: The Service Manager leverages TypeScript's type system
  to provide type safety for service definitions, injections, and usage.
- **Instance Management**: You can define multiple instances of the same service
  with different injections, allowing for flexibility and reusability.
- **Post-build Actions**: The Service Manager supports post-build asynchronous
  actions, enabling you to perform additional setup or initialization tasks
  after a service is instantiated.
- **Testing Support**: The modular design and dependency injection make it
  easier to write unit tests for your services.

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

   const serviceManager = new ServiceManager({
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

## More Information

For more information, more examples and the API reference,
check out the [TSDocs](./docs/) section.

## Contributing

Contributions are welcome! If you find any issues or have suggestions
for improvement, please open an issue or submit a pull request
on the [GitHub repository](https://github.com/lucastraba/service-manager).

## License

This project is licensed under
the [MIT License](https://opensource.org/licenses/MIT) © [Lucas Traba](https://github.com/lucastraba).
