# Local data and privacy

This document describes the supplied 0.1.0 source build. It is a starting point for accurate store disclosures; add the actual publisher identity and support contact before publishing a policy. No contact address is invented here.

- Project names, genre, phase, notes, task titles, completion values and local timestamps are stored through AsyncStorage on the device. On web, the storage belongs to that browser and origin.
- There is no app account, cloud database, custom API, analytics, advertising, payment SDK or Roblox authentication. The app does not request Roblox credentials or API keys.
- Ideas are assembled locally. Calculator inputs and script search state stay in running app memory; they are not sent to a service and are not saved between launches.
- The app can write selected script text or a workspace backup to the system clipboard when the user taps Copy. Other apps/the OS may have access to the clipboard under their platform rules. No clipboard is read automatically.
- Export/share sends the selected source file or backup to a share target chosen by the user. That destination's own handling applies. JSON backups contain the project notes and tasks in plain text. Native exports create files in the app cache; the OS may clear cached files later.
- Device storage is not an encrypted secrets vault. Do not put passwords, payment details or private access tokens in project notes or shared code. Device/OS backup behavior is controlled by the platform.
- Delete project removes it from the current workspace after confirmation. To remove all projects, export if wanted and delete each one, or restore a validated empty workspace (`{"version":1,"projects":[]}`) through the explicit replace confirmation. User-exported files and clipboard contents are separate copies; delete them at their destinations if needed.
- Uninstalling, clearing app data or clearing browser site data may remove local projects. There is no server copy to recover them from. Keep an exported backup.
- During development, Expo Go/Metro and package downloads have their own networking and service behavior. These are separate from the app's local data model. An installed standalone native build bundles the working tools and templates.

If you later add crash reporting, cloud sync, accounts, billing or advertising, revisit this document and the store privacy/data-safety declarations before shipping that version.
