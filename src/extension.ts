import * as vscode from 'vscode';

type Matches = (number | undefined)[];

let statusBar: vscode.StatusBarItem;

let searchInput: string = '';
let isSearchModeActive: boolean = false;
let searchContext: {
  searchTerm: string;
  matches: Matches;
  currentIndex: number;
} | null;

function setStatusBarMessage(msg: string) {
  statusBar.text = msg;
}

function setSearchModeStatus(isActiveNew: boolean) {
  isSearchModeActive = isActiveNew;
  vscode.commands.executeCommand(
    'setContext',
    'find-and-jump.isSearchModeActive',
    isActiveNew,
  );
}

function initializeStatusBar() {
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBar.command = 'find-and-jump.exitSearchMode';
  statusBar.tooltip = 'Click to exit search mode.';
  statusBar.show();

  setStatusBarMessage('Extension activated');
}

/** Executed on activation. */
export function activate(context: vscode.ExtensionContext) {
  console.debug('Activated');

  initializeStatusBar();

  const disposableCommandActivateSearchMode = vscode.commands.registerCommand(
    'find-and-jump.activateSearchMode',
    () => {
      setSearchModeStatus(true);
      setStatusBarMessage('Search mode activated');
    },
  );

  const disposableCommandType = vscode.commands.registerCommand(
    'type',
    (event) => {
      if (isSearchModeActive) {
        searchInput += event.text;
        // perform search
      } else {
        // fall back to the default type command
        vscode.commands.executeCommand('default:type', event);
      }
    },
  );

  const disposableCommandExitSearchMode = vscode.commands.registerCommand(
    'find-and-jump.exitSearchMode',
    () => {
      exitSearchMode();
    },
  );

  context.subscriptions.push(
    statusBar,
    disposableCommandActivateSearchMode,
    disposableCommandType,
    disposableCommandExitSearchMode,
  );
}

function exitSearchMode() {
  setSearchModeStatus(false);
  searchInput = '';
  searchContext = null;

  const msg = 'Exited search mode';
  console.debug(msg);
  setStatusBarMessage(msg);
}

/** Executed on deactivation. */
export function deactivate() {
  console.debug('Deactivated');
}
