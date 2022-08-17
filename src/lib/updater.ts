import * as tauri from '@tauri-apps/api';

export async function initUpdater(
  { event, dialog, process }: typeof tauri,
  handleStoreUpdate: () => void
) {
  try {

    // emit update event on launch: will check for existing newer version and show dialog
    await event.emit('tauri://update');

    // check for newer version every day
    const DAY_MS = 24 * 60 * 60 * 1000;
    setInterval(() => event.emit('tauri://update'), DAY_MS);

    // listen for available update event and show dialog
    event.listen('tauri://update-available', async (updateEvent) => {
      const payload = updateEvent.payload as { version: string, body: string, date: string };

      const yes = await dialog.ask(
        payload.body,
        `Would you like to update Subspace Desktop to ${payload.version}?`
      );

      if (yes) {
        await event.emit('tauri://update-install');
        await process.relaunch();
        console.log('after installing update');
      } else {
        // if user rejects update app state to display that newer version is available (menu item)
        handleStoreUpdate();
      }
    });
  } catch (error) {
    console.log(error);
  }
}
