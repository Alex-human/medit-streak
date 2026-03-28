# iOS TestFlight Next Steps

These are the remaining Apple-side steps that could not be completed in Codex because this Mac does not currently have the full Xcode app installed and Apple account actions require your login.

## What is already done

- The app builds for web with `npm run build`.
- The app exports statically for iOS with `npm run build:native`.
- Capacitor iOS scaffolding is created under `ios/`.
- A native iCloud key-value storage bridge is added in `ios/App/CapApp-SPM/Sources/CapApp-SPM/`.
- The app can keep using browser storage on web and use native storage on iPhone.

## What you need to do

1. Install Xcode from the App Store.
2. Open `/Users/alexdiazmontilla/Documents/Operations /medit-streak/ios/App/App.xcodeproj`.
3. Sign in with your Apple Developer account inside Xcode.
4. In the `App` target, set your team under `Signing & Capabilities`.
5. Keep or update the bundle id `com.alexhuman.meditstreak`.
6. Add the `iCloud` capability and enable `Key-value storage`.
7. Build once on a real iPhone or simulator.
8. Archive the app and upload it to App Store Connect / TestFlight.

## Useful commands

```bash
export PATH="$HOME/.local/node/node-v24.14.1-darwin-arm64/bin:$PATH"
npm install
npm run ios:sync
```

Run `npm run ios:sync` again after any web-side change so the iOS wrapper gets the latest exported app.
