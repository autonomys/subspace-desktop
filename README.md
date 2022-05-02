# Subspace Desktop

Standalone Desktop application for farming on Subspace Network (includes both node and farmer).
Download and run this application to be a farmer on Subspace Network (currently on testnet).

# Minimum OS Requirements
Below is not necessarily strict boundaries, but rather what we have tested and confirmed so far.
The more we test, these minimum requirements below may get loosened.

- Windows 10+
- Ubuntu Linux 18.04+
- macOS 11+

# How to Install

1. Download the latest [release](https://github.com/subspace/subspace-desktop/releases) for your preferred platform.
2. Install the program.
3. Open `subspace-desktop` application.
4. Click the `Quick Start` option.
5. Wait for app to sync network size, and click `Start Plotting` (In this version, you plot the full history. In future versions you will be able to set your plot size on this page).
6. The network will begin to sync, while you wait you can click `next` to open up the `what is plotting` page, and reveal your `seed` phrase, and provide you with our social links.
7. Once the node fully syncs you will be taken the the Farmer Dashboard which will show you the network status, and if you have won any blocks.

# How to Upgrade

## Upgrade from previous version of Subspace Desktop

1. Simply uninstall the old application from your computer
2. Download the latest [release](https://github.com/subspace/subspace-desktop/releases) for your preferred platform (make sure to select "Latest" release with green label and not "Pre-release")
3. Install new version of Subspace Desktop
4. Run the application, it should detect your old plot and continue farming as usual

**UNLESS STATED OTHERWISE IN THE RELEASE NOTES:**
- You don't need to delete your existing plot
- You don't need to create a new identity
- You don't need to delete the config files

## Upgrade from CLI (subspace-node + subspace-farmer)

These instructions are for upgrading installation that followed [official guide](https://github.com/subspace/subspace/blob/main/docs/farming.md),
if you followed unofficial one, ask guide author for proper upgrade steps.

1. Remove old data to free space used by CLI:
    ```bash
    # Replace `FARMER_FILE_NAME` with the name of the node file you downloaded from releases
    ./FARMER_FILE_NAME wipe
    # Replace `NODE_FILE_NAME` with the name of the node file you downloaded from releases
    ./NODE_FILE_NAME purge-chain --chain testnet
    ```
   Make sure to replace `FARMER_FILE_NAME` and `NODE_FILE_NAME` with actual file names
2. Delete those files `FARMER_FILE_NAME` and `NODE_FILE_NAME`
3. Install Subspace Desktop
4. If you didn't specify `--reward-address`, didn't import mnemonic or don't care, use "Quick start" at the first screen
5. In case you specified `--reward-address` when running your farmer before, choose "Advanced" on the first screen and use the same reward address there
6. In case you imported mnemonic before, choose "Advanced" and specify the address that corresponds to that mnemonic (can be found in Polkadot.js waller or explorer, both "any chain", "Polkadot" and Subspace addresses are fine)
7. If you didn't specify `--reward-address` and didn't import mnemonic and farmed some coins already, use `./FARMER_FILE_NAME identity view --mnemonic` to find mnemonic (replace `FARMER_FILE_NAME` with the actual file name), import it into Polkadot.js wallet and follow step 6 above

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
