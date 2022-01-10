# How to test with farming (for developers)

> 3 terminals are required. 1 for node, 1 for quasar, 1 for tauri.

*Things to keep in mind:*

- Desktop app initiates the connection to the node when the app starts. So basically, we are making 2 connections with the node (1 for desktop app, 1 for farmer)

### Node (first terminal):

1. make sure no other node is running, otherwise address conflict happens
2. move to the `subspace` repo in the terminal
3. `cargo run --release --bin subspace-node -- --dev --tmp`

Note: tauri can connect to an online node as well, but finding a block in that setting may take too much time if we start from an empty plotting.
If you don’t want to mess with your current plotting, trying dev environment can be a good temporary solution.

### Quasar (second terminal):

1. move to the `subspace-desktop` repo in the terminal
2. `yarn quasar dev`

### Tauri (third terminal):

1. move to the `subspace-desktop` repo in the terminal
2. If there has been a change in the subspace repo, it’s best to:
  1. move to `src-tauri`
  2. run `cargo update`
  3. go back to `subspace-desktop` root
3. `yarn tauri dev`
