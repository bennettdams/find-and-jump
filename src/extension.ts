import * as vscode from 'vscode';

let statusBar: vscode.StatusBarItem;

function setStatusBarMessage(msg: string) {
  statusBar.text = msg;
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
}

/** Executed on deactivation. */
export function deactivate() {}
