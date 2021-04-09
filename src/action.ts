import { TextDocument, CodeAction, CodeActionContext, CodeActionProvider, Range, workspace, Document } from 'coc.nvim';

export class PydocstringCodeActionProvider implements CodeActionProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext) {
    const extensionConfig = workspace.getConfiguration('pydocstring');
    const isEnableFileAction = extensionConfig.get('enableFileAction', false);

    const doc = workspace.getDocument(document.uri);

    const codeActions: CodeAction[] = [];

    /** Line */
    if (range.start.line === range.end.line && range.start.character === 0) {
      // To match the style of the range type (zero base)
      const fullRangeLength = doc.getLines().length - 1;

      let endBlockRangeLine = range.end.line;
      let funcOrClassSuffixLine = range.end.line;

      for (let i = range.start.line; i <= fullRangeLength; i++) {
        if (this.validLineOfFuncOrClassSuffix(doc.getline(i))) {
          funcOrClassSuffixLine = i;
          break;
        }
      }

      // "doq" cannot process the "--end" option if the line is empty or a #,
      // it further loops to check for lines with other strings.
      for (let i = funcOrClassSuffixLine; i <= fullRangeLength; i++) {
        if (i !== funcOrClassSuffixLine && doc.getline(i).trim() !== '' && !doc.getline(i).trim().startsWith('#')) {
          endBlockRangeLine = i;
          break;
        }
      }

      const resolveRange = Range.create(
        { character: range.start.character, line: range.start.line },
        { character: range.end.character, line: endBlockRangeLine }
      );

      if (this.validDocstringStartLine(doc, range)) {
        const title = `Add docstirng for "Line" by pydocstring`;
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
    }

    /** Range */
    if (range.start.line < range.end.line && !this.wholeRange(doc, range)) {
      // To match the style of the range type (zero base)
      const fullRangeLength = doc.getLines().length - 1;

      let endBlockRangeLine = range.end.line;

      let hasFuncOrClassSuffix = false;
      for (let i = range.start.line; i <= range.end.line; i++) {
        if (this.validLineOfFuncOrClassSuffix(doc.getline(i))) {
          hasFuncOrClassSuffix = true;
          endBlockRangeLine = endBlockRangeLine + 1;
        }
      }

      // "doq" cannot process the "--end" option if the line is empty or a #,
      // it further loops to check for lines with other strings.
      for (let i = endBlockRangeLine; i <= fullRangeLength; i++) {
        if (
          doc.getline(i + 1).trim() !== '' &&
          !doc
            .getline(i + 1)
            .trim()
            .startsWith('#')
        ) {
          endBlockRangeLine = i + 1;
          break;
        }
      }

      const resolveRange = Range.create(
        { character: range.start.character, line: range.start.line },
        { character: range.end.character, line: endBlockRangeLine }
      );

      if (this.validDocstringStartLine(doc, range) && hasFuncOrClassSuffix) {
        const title = `Add docstirng for "Range" by pydocstring`;
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
    }

    /** Whole (File) */
    if (this.wholeRange(doc, range) && isEnableFileAction) {
      const title = `Add docstirng for "File" by pydocstring`;
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

  private wholeRange(doc: Document, range: Range): boolean {
    const whole = Range.create(0, 0, doc.lineCount, 0);
    return (
      whole.start.line === range.start.line &&
      whole.start.character === range.start.character &&
      whole.end.line === range.end.line &&
      whole.end.character === whole.end.character
    );
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
      //console.log('---- debug1 ----');
      return true;
    }

    if (lineCharacter.match(/\):/)) {
      //console.log('---- debug2 ----');
      return true;
    }

    if (lineCharacter.match(/\]:/)) {
      //console.log('---- debug3 ----');
      return true;
    }

    if (lineCharacter.match(/\s*class\s*.*:$/)) {
      //console.log('---- debug4 ----');
      return true;
    }

    if (lineCharacter.match(/.*\)\s->\s.*:/)) {
      //console.log('---- debug5 ----');
      return true;
    }

    return false;
  }
}

export default PydocstringCodeActionProvider;
