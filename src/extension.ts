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
  statusBar.text = `${isSearchModeActive ? '🔵' : ''} ${msg}`;
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

function setInitialSearchModeMessage() {
  setStatusBarMessage('Search mode activate');
}

function setSearchModeStatus(isActiveNew: boolean) {
  isSearchModeActive = isActiveNew;
  vscode.commands.executeCommand(
    'setContext',
    'findAndJump.isSearchModeActive',
    isActiveNew,
  );
}

function initializeStatusBar() {
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBar.command = 'findAndJump.exitSearchMode';
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
    'findAndJump.activateSearchMode',
    () => {
      console.debug('Command: activateSearchMode');

      if (!isSearchModeActive) {
        setSearchModeStatus(true);
        setInitialSearchModeMessage();
      }
    },
  );

  const disposableCommandType = vscode.commands.registerCommand(
    'type',
    (event) => {
      console.debug('Command: type');

      if (isSearchModeActive) {
        searchInput += event.text;
        executeSearch(searchInput);
      } else {
        // Fall back to the default type command
        vscode.commands.executeCommand('default:type', event);
      }
    },
  );

  const disposableCommandCaptureBackspace = vscode.commands.registerCommand(
    'findAndJump.captureBackspace',
    () => {
      console.debug('Command: captureBackspace');

      if (isSearchModeActive) {
        // Handle backspace key: remove the last character
        if (searchInput.length > 0) {
          searchInput = searchInput.slice(0, -1);
        }

        // Only search if the input is at least 1 character
        if (searchInput.length > 0) {
          executeSearch(searchInput);
        } else {
          setInitialSearchModeMessage();
        }
      }
    },
  );

  const disposableCommandExitSearchMode = vscode.commands.registerCommand(
    'findAndJump.exitSearchMode',
    () => {
      console.debug('Command: exitSearchMode');

      exitSearchMode();
    },
  );

  // Handle TAB keypress to cycle through matches
  const dispoCycleThrough = vscode.commands.registerCommand(
    'findAndJump.cycleThroughResults',
    () => {
      console.debug('Command: cycleThroughResults');

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

  const searchMsg = `Searching for: '${searchTerm}'`;

  if (noOfMatches === 0) {
    if (searchContext?.searchTerm) {
      searchContext.searchTerm = searchTerm;
    }

    setStatusBarMessage(`${searchMsg} | No matches`);
    showTooltipMessage(`No matches found for ${searchTerm}.`);
    return;
  } else {
    setStatusBarMessage(
      `${searchMsg} | ${noOfMatches} match${
        noOfMatches === 1 ? '' : 'es | Press TAB to cycle through'
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
  resetState();

  const msg = 'Exited search mode';
  console.debug(msg);
  setStatusBarMessage(msg);
}

function resetState() {
  searchInput = '';
  searchContext = null;
}

/** Executed on deactivation. */
export function deactivate() {
  console.debug('Deactivated');
}
