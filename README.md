# subspace / desktop-farmer

Built with Quasar + Tauri

# How to Install

1. Download the latest (release)[https://github.com/subspace/subspace-desktop/releases] for your preferred platform.
2. Install the program
3. Open `subspace-desktop` application
4. Click the `Quick Start` option
5. Provide a password and click `continue`
6. Wait for app to sync network size, and click `Start Plotting`. (In this version, you plot the full history. In future versions you will be able to set your plot size on this page.)
7. The network will begin to sync, while you wait you can click `next` to open up the `what is plotting` page, and reveal your `seed` phrase, and provide you with our social links.
8. Once the node fully syncs you will be taken the the Farmer Dashboard which will show you the network status, and if you have won any blocks.

# Development

## Prerequisites

- nodejs 14+
- yarn
- rustc

### Linux

On Linux you'll have to install development version of `libwebkit2gtk-4.0` and `libappindicator` packages, which can be done on Ubuntu with:

```bash
sudo apt update && sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libappindicator3-dev \
    patchelf \
    librsvg2-dev
```

- libappindicator: needed to use the system tray feature.
- patchelf and librsvg: needed to bundle AppImage.

Stuck?

https://tauri.studio/en/docs/getting-started/intro

## Install the dependencies

```bash
yarn
```

### Start the app in development mode

Terminal 1

```bash
yarn quasar dev
```

Terminal 2

```bash
yarn tauri dev
```

### Build the app for production (Builds Quasar and Tauri)

```bash
yarn build
```

### Access Tauri or Quasar specific commands

```bash
yarn quasar --help
yarn tauri --help
```

### Customize Quasar config
<https://v2.quasar.dev/quasar-cli/quasar-conf-js>

### Customize Tauri config
<https://tauri.studio/en/docs/api/config>

### Contribute to development
Review the [ARCHITECTURE.md](./ARCHITECTURE.md) document for an overview of the application design.
