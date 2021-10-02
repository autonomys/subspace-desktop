# Architecture

This document is meant to be a quick reference for developers looking to contribute towards this repo. This project is split into two main elements, the Frontend which uses Vue + Quasar and the backend which uses Rust + Tauri.

## Frontend (Vue + Quasar) `/src`

The main entry point for Frontend developers starts with [quasar.conf.js](./quasar.conf.js) which configures the Quasar framework. Read the documentation for quasar at [quasar.dev](https://quasar.dev/). All quasar related files are located in the `/src` folder.

### [`init.ts`](src/boot/init.ts)
In the config you can see `init.ts` registered under the boot array. `init.ts` Is where we place most initialization logic which needs to happen before Vue is initialized. The logic in this file registers third party Vue components and initializes global data structures that are shared among Vue components. For more information refer to the official documentation: [Quasar Boot files](https://quasar.dev/quasar-cli/boot-files#introduction).

### [`/App.ts`](src/App.vue)
The main entry point for the Vue app. This file is mostly just for holding the router-view but it's also a good place to place logic that will be run as soon as Vue is loaded.

### [`/router`](src/router)
Inside the router directory there is `index.ts` and `routes.ts`. Logic which needs to run during route changes can be added in `index.ts`. `routes.ts` is where routes are registered. Generally each registered route is a component inside the `/pages` directory. Read the [Vue Router Documentation](https://router.vuejs.org/).

### [`/layouts/MainLayout.vue`](src/layouts/MainLayout.vue)
Main Layout is the frame that all pages are rendered inside of. This includes the top navigation bar and menu elements.

### [`/pages`](src/pages)
