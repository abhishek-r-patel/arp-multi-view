# Local Setup Guide

This guide walks through installing and running ARP Multi View on a Windows development machine. The app runs in your browser and does not need a backend server or account.

## 1. Install Node.js and npm

Install a Node.js version supported by Vite: **Node.js `^20.19.0` or `>=22.12.0`**. The Node.js installer includes npm. After installation, close and reopen VS Code so its terminal picks up the updated `PATH`.

In VS Code, open **Terminal > New Terminal** and verify the tools:

```powershell
node --version
npm.cmd --version
```

If both commands print version numbers, continue to step 2.

### Portable Node.js on this machine

If Node.js is already installed as a portable folder under your user profile, add it to the current PowerShell terminal's `PATH`. For the portable Node.js folder currently used on this machine, run:

```powershell
$nodeHome = Join-Path $env:USERPROFILE 'Apps\Portable\node-v22.14.0-win-x64'
$env:Path = "$nodeHome;$env:Path"
node --version
npm.cmd --version
```

This changes `PATH` only for the current terminal. Repeat these commands in a new terminal, or install Node.js normally to make it available automatically.

## 2. Open the project folder

In VS Code, open the project folder containing `package.json`. Open a terminal (**Terminal > New Terminal**) and check that the current directory is the project root:

```powershell
Get-Location
```

If needed, change to the project folder (adjust the path if your copy is elsewhere):

```powershell
Set-Location 'C:\Users\Abhishek.Patel\Apps\Local-Dev\arp-multi-view'
```

## 3. Install project dependencies

Install the exact dependency versions recorded in `package-lock.json`:

```powershell
npm.cmd ci
```

Wait for the command to finish successfully before starting the app. Run this again after pulling project changes that update `package-lock.json`.

## 4. Start the development server

Run:

```powershell
npm.cmd run dev
```

When Vite reports that it is ready, open the **Local** URL it prints. It is usually:

```text
http://localhost:5173/
```

That URL is the version picker. From there, choose **Version 1** (`/v1`, the classic grid) or
**Version 2** (`/v2`, the collage). You can also open either route directly, for example
`http://localhost:5173/v2`. Vite's dev server serves `index.html` for those paths, so they
work on a hard refresh too.

Keep the terminal open while using the app. Vite reloads the page when source files change.

To access the dev server from another device on the same network, start it with:

```powershell
npm.cmd run dev -- --host 0.0.0.0
```

Use the **Network** URL printed by Vite on that device. Network access may also depend on your firewall settings.

## 5. Stop the server

Return to the terminal running Vite and press **Ctrl+C**. To run the project again later, open a terminal in the project root and repeat step 4; dependencies do not need to be reinstalled unless they have changed.

## Troubleshooting

- **`node` or `npm` is not recognized:** Install Node.js, reopen VS Code, and check the commands in step 1. For a portable installation, use the commands in the portable Node.js section. In PowerShell, `npm.cmd` avoids execution-policy errors that can affect `npm.ps1`.
- **`npm.cmd ci` fails:** Confirm the terminal is in the folder containing `package.json` and `package-lock.json`, and that the machine can reach the npm registry. Then retry the install.
- **Port 5173 is already in use:** Vite normally selects another available port and prints the URL to open. Use the URL from the terminal.
- **The page loads but a stream does not:** Stream playback and title lookup connect directly to YouTube or Kick from your browser. Check network access and browser restrictions; corporate or school content filters may block those services.
- **A version 2 chat panel stays blank:** Chat only renders while that stream is actually live — YouTube shows "Chat is disabled for this live stream" otherwise. A blank panel usually means the provider's chat page is being blocked from being framed, commonly by a corporate filter such as Zscaler. Use the **↗** button in the chat header to open it in a normal tab.
- **Version 2 search finds nothing for a YouTube channel name:** Only Kick channel names can be searched. For YouTube, paste the live video URL or a `/channel/UC...` URL.
- **`/v1` or `/v2` returns 404 on a static host:** History-based routing needs the host to serve `index.html` for unknown paths. `npm.cmd run dev` and `npm.cmd run preview` already do this, and `public/_redirects` covers the Cloudflare Pages deployment. Any other host needs its own rewrite rule to `index.html`.

## Optional project checks

From the project root, run the linter and production build with:

```powershell
npm.cmd run lint
npm.cmd run build
```

The production build output is written to `dist/`. These checks are not needed to start the development server.