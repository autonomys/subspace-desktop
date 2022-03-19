import { Dialog } from "quasar"

export function emptyDirectoryInfo(plotDirectory: string): void {
  Dialog.create({
    title: `Selected directory is not empty!`,
    message: `
        <p style="font-size:12px;">
          Plots Directory must be empty.</br>
        </p>
        <p style="font-size:14px; color: orange">
          <b>${plotDirectory}</b>
        </p>
        `,
    html: true,
    dark: true,
    ok: { label: "Close", icon: "close", flat: true, color: "gray" }
  })
}

export function newDirectoryConfirm(
  plotDirectory: string,
  startPlotting: () => Promise<void>
): void {
  Dialog.create({
    title: `Do you want to create a new directory?`,
    message: `
      <p style="font-size:12px;">
        A new directory will be created.</br>
      </p>
      <p style="font-size:14px; color: #2196f3">
        <b>${plotDirectory}</b>
      </p>
`,
    html: true,
    dark: true,
    ok: { label: "Create", icon: "check", flat: true, color: "blue" },
    cancel: { label: "Cancel", icon: "cancel", flat: true, color: "grey" }
  }).onOk(() => {
    startPlotting()
  })
}

export function existingDirectoryConfirm(
  plotDirectory: string,
  startPlotting: () => Promise<void>
): void {
  Dialog.create({
    title: `Confirm selected directory.`,
    message: `
    <p style="font-size:12px;">
      Seleted plot directory.</br>
    </p>
    <p style="font-size:14px; color: #2196f3">
      <b>${plotDirectory}</b>
    </p>
`,
    html: true,
    dark: true,
    ok: {
      label: "Confirm",
      icon: "check",
      flat: true,
      color: "blue"
    },
    cancel: {
      label: "Cancel",
      icon: "cancel",
      flat: true,
      color: "grey"
    }
  }).onOk(() => {
    startPlotting()
  })
}
