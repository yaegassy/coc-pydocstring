import {
  CodeAction,
  CodeActionContext,
  CodeActionProvider,
  Document,
  OutputChannel,
  Range,
  TextDocument,
  workspace,
} from 'coc.nvim';

export class PydocstringCodeActionProvider implements CodeActionProvider {
  private outputChannel: OutputChannel;

  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext) {
    const extensionConfig = workspace.getConfiguration('pydocstring');
    const isEnableFileAction = extensionConfig.get('enableFileAction', false);

    const doc = workspace.getDocument(document.uri);

    const codeActions: CodeAction[] = [];

    /** Line & Selected */
    if (this.lineRange(range) || this.selectedRange(doc, range)) {
      // To match the style of the range type (zero base)
      const fullRangeLength = doc.getLines().length - 1;

      // Initial value
      let resolveEndRangeLine = 0;
      let resolveEndRangeChara = 0;
      let funcOrClassSuffixLine = 0;
      let isSameLineMatched = false;

      if (!this.validDocstringStartLine(doc, range)) {
        return;
      }

      // Checking the end string line of a function definition
      for (let i = range.start.line; i <= range.end.line; i++) {
        if (this.validLineOfFuncOrClassSuffix(doc.getline(i))) {
          funcOrClassSuffixLine = i;
          isSameLineMatched = true;
        }
      }

      // MEMO: If the function definition line does not have a function exit string
      if (!isSameLineMatched) {
        for (let i = range.start.line; i <= fullRangeLength; i++) {
          if (this.validLineOfFuncOrClassSuffix(doc.getline(i))) {
            funcOrClassSuffixLine = i;
            break;
          }
        }
      }

      for (let i = funcOrClassSuffixLine; i <= fullRangeLength; i++) {
        if (
          i !== funcOrClassSuffixLine &&
          doc.getline(i).trim() !== '' &&
          !doc.getline(i).trim().startsWith('#') &&
          !doc.getline(i).trim().startsWith('"')
        ) {
          resolveEndRangeLine = i;
          break;
        }
      }

      const fullEndChara = doc.getline(resolveEndRangeLine).length;
      const trimEndChara = doc.getline(resolveEndRangeLine).trim().length;
      resolveEndRangeChara = fullEndChara + trimEndChara;

      const resolveRange = Range.create(
        // MEMO: range.start.character is fixed at 0
        { line: range.start.line, character: 0 },
        { line: resolveEndRangeLine, character: resolveEndRangeChara }
      );

      const title = `Add docstring for "Line or Selected" by pydocstring`;
      const command = {
        title: '',
        command: 'pydocstring.runAction',
        arguments: [document, resolveRange],
      };

      const action: CodeAction = {
        title,
        command,
      };

      codeActions.push(action);
    }

    /** Whole (File) */
    if (this.wholeRange(doc, range) && isEnableFileAction) {
      const title = `Add docstring for "File" by pydocstring`;
      const command = {
        title: '',
        command: 'pydocstring.runAction',
        arguments: [document, range],
      };

      const action: CodeAction = {
        title,
        command,
      };

      codeActions.push(action);
    }

    return codeActions;
  }

  private validDocstringStartLine(doc: Document, range: Range): boolean {
    if (
      doc
        .getline(range.start.line)
        .slice(range.start.character)
        .trim()
        .match(/^def\s*/) ||
      doc
        .getline(range.start.line)
        .slice(range.start.character)
        .trim()
        .match(/^async def\s*/) ||
      doc
        .getline(range.start.line)
        .slice(range.start.character)
        .trim()
        .match(/^class\s*.*/)
    ) {
      return true;
    }
    return false;
  }

  private validLineOfFuncOrClassSuffix(lineCharacter: string): boolean {
    if (lineCharacter.endsWith('):')) {
      return true;
    }

    if (lineCharacter.match(/\):/)) {
      return true;
    }

    if (lineCharacter.match(/\]:/)) {
      return true;
    }

    if (lineCharacter.match(/\s*class\s*.*:$/)) {
      return true;
    }

    if (lineCharacter.match(/.*\)\s->\s.*:/)) {
      return true;
    }

    return false;
  }

  private wholeRange(doc: Document, range: Range): boolean {
    const whole = Range.create(0, 0, doc.lineCount, 0);
    return (
      whole.start.line === range.start.line &&
      whole.start.character === range.start.character &&
      whole.end.line === range.end.line &&
      whole.end.character === whole.end.character
    );
  }

  private selectedRange(doc: Document, range: Range): boolean {
    return range.start.line < range.end.line && !this.wholeRange(doc, range);
  }

  private lineRange(range: Range): boolean {
    return (
      /** After */
      // https://github.com/neoclide/coc.nvim/commit/cad8c6b1f0b280404ff627d08e62fcc17dabed35
      (range.start.line + 1 === range.end.line && range.start.character === 0 && range.end.character === 0) ||
      /** Older */
      (range.start.line === range.end.line && range.start.character === 0)
    );
  }
}

export default PydocstringCodeActionProvider;
