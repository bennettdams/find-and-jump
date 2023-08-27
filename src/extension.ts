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

const searchDecorationType = vscode.window.createTextEditorDecorationType({
  // TODO Pick custom color
  backgroundColor: { id: 'myExtension.searchHighlight' },
});

function showTooltipMessage(
  msg: string,
  type: 'default' | 'error' = 'default',
) {
  switch (type) {
    case 'default': {
      vscode.window.showInformationMessage(msg);
      break;
    }
    case 'error': {
      vscode.window.showErrorMessage(msg);
      break;
    }
    default: {
      throw new Error(`Unkown tooltip type: ${type}`);
    }
  }
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

function createRange({
  matchIndex,
  searchTerm,
  document,
}: {
  matchIndex: number | undefined;
  searchTerm: string;
  document: vscode.TextDocument;
}) {
  if (typeof matchIndex === 'undefined') {
    showTooltipMessage(
      'Something went wrong. See logs for more information. Error: Missing match index',
    );
    throw new Error('Missing match index');
  }

  const startPos = document.positionAt(matchIndex);
  const endPos = document.positionAt(matchIndex + searchTerm.length);
  const range = new vscode.Range(startPos, endPos);

  return range;
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
        executeSearch(searchInput, context.subscriptions);
      } else {
        // Fall back to the default type command
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

  // Handle TAB keypress to cycle through matches
  const dispoCycleThrough = vscode.commands.registerCommand(
    'find-and-jump.cycleThroughResults',
    () => {
      if (!searchContext) {
        throw new Error('Missing search context');
      }

      // Determine index with modulo to jump to the first match after the last match
      const newCurrentIndex =
        (searchContext.currentIndex + 1) % searchContext.matches.length;
      searchContext.currentIndex = newCurrentIndex;

      const matchIndex = searchContext.matches.at(searchContext.currentIndex);

      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        throw new Error('No active text editor');
      } else {
        const range = createRange({
          matchIndex,
          searchTerm: searchContext.searchTerm,
          document: activeTextEditor.document,
        });

        // Select the search result
        activeTextEditor.selection = new vscode.Selection(
          range.start,
          range.end,
        );
        // Scroll to search result
        activeTextEditor.revealRange(
          range,
          vscode.TextEditorRevealType.InCenter,
        );
      }
    },
  );

  context.subscriptions.push(
    statusBar,
    disposableCommandActivateSearchMode,
    disposableCommandType,
    dispoCycleThrough,
    disposableCommandCaptureBackspace,
    disposableCommandExitSearchMode,
  );
}

function executeSearch(searchTerm: string) {
  console.debug('######## Executing search for: ', searchTerm);

  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    showTooltipMessage('No active text editor.', 'error');
    return;
  }

  const document = activeTextEditor.document;
  const documentText = document.getText();
  const regex = new RegExp(searchTerm, 'g');

  const matches: Matches = Array.from(
    documentText.matchAll(regex),
    (match) => match.index,
  );
  const noOfMatches = matches.length;

  if (noOfMatches === 0) {
    showTooltipMessage(`No matches found for ${searchTerm}.`);
    return;
  } else {
    setStatusBarMessage(
      `Searching for: '${searchTerm}' | ${noOfMatches} result${
        noOfMatches === 1 ? '' : 's | Press TAB to cycle through'
      }`,
    );
  }

  // Apply decorations to the matches
  let matchDecorations: vscode.DecorationOptions[] = matches
    .filter((matchIndex) => typeof matchIndex === 'number')
    .map((matchIndex) => {
      return {
        range: createRange({
          matchIndex,
          searchTerm,
          document: activeTextEditor.document,
        }),
      };
    });

  // Initially set the selection to the first match
  const firstMatchDecoration = matchDecorations.at(0);
  if (!!firstMatchDecoration) {
    activeTextEditor.selection = new vscode.Selection(
      firstMatchDecoration.range.start,
      firstMatchDecoration.range.end,
    );

    activeTextEditor.setDecorations(searchDecorationType, matchDecorations);
  }

  // Store the matches and search term in a context for navigation
  searchContext = { searchTerm, matches, currentIndex: 0 };

  console.debug('######## End of executing search');
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
