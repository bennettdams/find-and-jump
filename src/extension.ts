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

  const disposableCommandExitSearchMode = vscode.commands.registerCommand(
    'find-and-jump.exitSearchMode',
    () => {
      exitSearchMode();
    },
  );

  context.subscriptions.push(statusBar, disposableCommandExitSearchMode);
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
export function deactivate() {}
