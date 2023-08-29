# Find & Jump 🔍🦘 (VS Code extension)

Easy way to find text, jump to it and cycle through matches, directly in your active editor window.

<img src="images/logo-find-and-jump.png" alt="Find & Jump logo" width="300"/>

## Usage

1. Press a keybinding to activate search mode
2. Enter your search text
3. Every new character will show new matches and select the closest match automatically
4. Press another key (e.g. TAB) to cycle through the matches

The difference to other extensions like this is that every keystroke will show & select new matches, without the need to confirm your search first.

<img src="images/demo-find-and-jump.gif" alt="Find & Jump demo" width="700"/>

## Extension Settings

### Configuration

- Case-sensitive search
  - `findAndJump.caseSensitiveSearch`
  - _default: false_
- Show a tooltip if the current search has no matches
  - `findAndJump.showTooltipIfNoMatches`
  - _default: false_
- Custom background color for all matches
  - `findAndJump.matchesColor.background`
  - _default: "#3e56c2"_
- Custom foreground color for all matches
  - `findAndJump.matchesColor.foreground`
  - _default: "white"_
- Custom background color for the currently selected match
  - `findAndJump.currentMatchColor.background`
  - _default: "#132eab"_
- Custom foreground color for the currently selected match
  - `findAndJump.currentMatchColor.foreground`
  - _default: "white"_

### Keybindings

There are three main keybindings: activate, exit and cycle through matches.

- Activate search mode
  - `findAndJump.activateSearchMode`
  - _default: Alt + Q_
- Exit search mode
  - `findAndJump.exitSearchMode`
  - _default: Escape_
- Cycle through results in search mode. Only active when search mode is active.
  - `findAndJump.cycleThroughMatches`
  - _default: Tab_
- Cycle backwards through results in search mode. Only active when search mode is active.
  - `findAndJump.cycleThroughMatchesBackwards`
  - _default: Shift + Tab_

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
{
  "key": "shift+tab",
  "command": "findAndJump.cycleThroughMatchesBackwards",
  "when": "editorTextFocus && findAndJump.isSearchModeActive"
},
```

## Release Notes

🚧 Still under construction 🚧

[Please refer to the GitHub releases.](https://github.com/bennettdams/find-and-jump/releases)
