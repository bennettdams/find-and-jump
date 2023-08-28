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

type ExtensionSetting =
  | 'showTooltipIfNoMatches'
  | 'caseSensitiveSearch'
  | 'matchesColor.foreground'
  | 'matchesColor.background'
  | 'currentMatchColor.foreground'
  | 'currentMatchColor.background';

function readConfiguration(settingKey: ExtensionSetting) {
  const extensionConfig = vscode.workspace.getConfiguration('findAndJump');
  const configValue = extensionConfig.get<string>(settingKey);

  if (configValue === undefined) {
    const msg = `Missing config value for ${settingKey}`;
    showTooltipMessage(msg, 'error');
    throw new Error(msg);
  }

  return configValue;
}

/**
 * This needs to be defined "globally" as `setDecorations` relies on a stable instance when overwriting one.
 * Without this, "old" (already applied) decorations would not be reset (e.g. when entering characters as search input).
 *
 * See: https://github.com/microsoft/vscode-extension-samples/issues/22
 */
const decorations = {
  matches: vscode.window.createTextEditorDecorationType({
    backgroundColor: readConfiguration('matchesColor.background'),
    color: readConfiguration('matchesColor.foreground'),
  }),
  currentMatch: vscode.window.createTextEditorDecorationType({
    backgroundColor: readConfiguration('currentMatchColor.background'),
    color: readConfiguration('currentMatchColor.foreground'),
  }),
};

function setTextDecoration(
  activeTextEditor: vscode.TextEditor,
  decorationOptions: vscode.DecorationOptions[],
) {
  activeTextEditor.setDecorations(decorations.matches, decorationOptions);
}

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

function setSelection(range: vscode.Range) {
  const activeTextEditor = vscode.window.activeTextEditor;

  if (!activeTextEditor) {
    throw new Error('No active text editor');
  } else {
    // Set the active decoration for search result
    activeTextEditor.setDecorations(decorations.currentMatch, [range]);
    // Select the search result
    activeTextEditor.selection = new vscode.Selection(range.start, range.end);
    // Scroll to search result
    activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  }
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
    'findAndJump.cycleThroughMatches',
    () => {
      console.debug('Command: cycleThroughMatches');

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

        setSelection(range);
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
  const isCaseSensitiveSearch = Boolean(
    readConfiguration('caseSensitiveSearch'),
  );
  const flags = isCaseSensitiveSearch === true ? 'g' : 'gi';
  const regex = new RegExp(searchTerm, flags);

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

    if (!!readConfiguration('showTooltipIfNoMatches')) {
      showTooltipMessage(`No matches found for ${searchTerm}.`);
    }
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

  setTextDecoration(activeTextEditor, matchDecorations);

  // Initially set the selection to the first match
  const firstMatchDecoration = matchDecorations.at(0);
  if (!!firstMatchDecoration) {
    setSelection(firstMatchDecoration.range);
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

  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    throw new Error('No active text editor');
  } else {
    activeTextEditor.setDecorations(decorations.matches, []);
    activeTextEditor.setDecorations(decorations.currentMatch, []);
  }
}

/** Executed on deactivation. */
export function deactivate() {
  console.debug('Deactivated');
}
