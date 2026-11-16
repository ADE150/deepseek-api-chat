# Changelog

## v0.2.0 — 2026-11-16

Project renamed from ChatLoom to **DSChat**; repository name: `deepseek-api-chat`.

### Added

- **Pinned conversations**: pin/unpin from the session menu, with a dedicated Pinned group.
- **Message-level search**: search all conversations, show one row per matching message,
  repeat a conversation for each hit, highlight the match, and jump to the message.
- **Interactive drawer**: the mobile drawer follows the finger, updates the mask opacity,
  and settles with a transition; swipe left on the drawer to close.
- Left-edge Android gesture exclusion so edge swipes reach the WebView.

### Changed

- App name, package name (`io.github.ade150.dschat`), IndexedDB/localStorage keys, PWA
  manifest, service worker cache, and Android project renamed to DSChat.
- README/NOTICE rewritten around DeepSeek's official open-source `chat-demo` framework,
  with clearer attribution and a community-project disclaimer.
- Android version bumped to `0.2.0` (versionCode 3).

## v0.1.1 — 2026-11-16

### Added

- Swipe right from the left half of the screen to open the mobile conversation drawer.
- Android native gesture exclusion for the left edge, so edge swipes reach the WebView
  instead of triggering the system back gesture on compatible ROMs.
- Auto read-aloud toggle in the mobile header (left of the new-chat button). When enabled,
  every newly completed assistant reply is read aloud automatically; the setting persists.
- Full-screen in-app image viewer with a close button, background tap, Esc, and Android
  back-key support.

### Fixed

- Uploaded images no longer open a blob URL in a new WebView window, which caused a black
  screen and made the back key leave the current conversation.
- Image viewing now returns to the same conversation instead of starting a new chat.

### Changed

- Auto read-aloud unlocks the audio context when the toggle is enabled, so replies can
  start speaking without a direct tap on each answer.

## v0.1.0 — 2026-11-16

First ChatLoom release, based on `deepseek-ai/chat-demo` v0.1.1.

### Added

- Conversation forking: fork a new chat from any assistant reply, or before any user
  question, while keeping the original conversation unchanged.
- `forkedFrom` metadata on forked sessions for future branch-graph views.
- PWA support: web app manifest, app icons, installable standalone display, and a
  service worker that caches the app shell for offline use.
- Capacitor Android app (`io.github.ade150.chatloom`) with:
  - Android back-button handling for modals, search panel, and the mobile sidebar.
  - Status-bar style synchronization with the app theme.
  - Microphone permission and `getUserMedia` support for voice input.
  - File picker support for attachments.
  - Native share sheet for exporting chat history.
- Cross-platform build helpers (`pnpm build`, `pnpm android:apk`).
- ChatLoom branding, icon, splash screen, README (English and Chinese), NOTICE, and
  upstream attribution.

### Changed

- IndexedDB database renamed to `chatloom`; localStorage keys use the `chatloom:` prefix.
- Android `allowBackup` disabled so API keys and chats are not included in cloud backups.

### Notes

- The history export keeps the `deepseek_data-日期.zip` filename and v3 format so it can
  be imported into compatible clients.
- This is an unofficial community project, not a DeepSeek product.
