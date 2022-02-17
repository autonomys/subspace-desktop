# subspace / desktop-farmer

Built with Quasar + Tauri

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
