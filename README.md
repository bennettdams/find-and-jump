# Find & Jump 🔍🦘 (VS Code extension)

Easy way to find text, jump to it and cycle through matches, directly in your active editor window.

## Features

1. Press a keybinding to activate search mode
2. Enter your search text
3. Every new character will show new matches
4. Press another key (e.g. TAB) to cycle through the matches

The difference to other extensions like this is that every keystroke will show you new matches, without the need to confirm your search first.

<!-- \!\[feature X\]\(images/feature-x.png\) -->

## Extension Settings

This extension has no specific settings besides custom keybindings.

### Keybindings

There are three main keybindings: activate, exit and cycle through matches.

- `findAndJump.activateSearchMode`
  - Activate search mode
  - _default: Alt + Q_
- `findAndJump.exitSearchMode`
  - Exit search mode
  - _default: Escape_
- `findAndJump.cycleThroughMatches`
  - Cycle through results in search mode. Only active when search mode is active.
  - _default: Tab_

Here's the default keybindings for the JSON settings:

```json
{
  "key": "alt+q",
  "command": "findAndJump.activateSearchMode",
  "when": "editorTextFocus"
},
{
  "key": "escape",
  "command": "findAndJump.exitSearchMode",
  "when": "editorTextFocus && findAndJump.isSearchModeActive"
},
{
  "key": "tab",
  "command": "findAndJump.cycleThroughMatches",
  "when": "editorTextFocus && findAndJump.isSearchModeActive"
},
```

## Release Notes

🚧 Still under construction 🚧

[Please refer to the GitHub releases.](https://github.com/bennettdams/find-and-jump/releases)
