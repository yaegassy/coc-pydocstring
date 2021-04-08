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
      const fullTextLine = doc.getLines().length;

      let endBlockLine = range.end.line;
      let endBlockCharacter = range.end.character;

      // Line: range.start.line -> ++
      for (let i = range.start.line; i < fullTextLine; i++) {
        if (
          doc.getline(i).endsWith('):') ||
          doc.getline(i).match(/\):/) ||
          doc.getline(i).match(/\]:/) ||
          doc.getline(i).match(/\s*class\s*.*:/) ||
          doc.getline(i).match(/.*\)\s->\s.*:/)
        ) {
          endBlockLine = i + 1;
          endBlockCharacter = doc.getline(i).length;
          break;
        }
      }

      const resolveRange = Range.create(
        { character: range.start.character, line: range.start.line },
        { character: endBlockCharacter, line: endBlockLine }
      );

      if (
        doc
          .getline(range.start.line)
          .trim()
          .match(/^def\s*/) ||
        doc
          .getline(range.start.line)
          .trim()
          .match(/^class\s*.*/)
      ) {
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
      const fullTextLine = doc.getLines().length;

      let endBlockLine = range.end.line;
      let endBlockCharacter = range.end.character;

      // Range: range.end.line -> --
      for (let i = range.end.line; i < fullTextLine; i--) {
        if (
          doc.getline(i).endsWith('):') ||
          doc.getline(i).match(/\):/) ||
          doc.getline(i).match(/\]:/) ||
          doc.getline(i).match(/\s*class\s*.*:/) ||
          doc.getline(i).match(/.*\)\s->\s.*:/)
        ) {
          endBlockLine = i + 1;
          endBlockCharacter = doc.getline(i).length;
          break;
        }
      }

      const resolveRange = Range.create(
        { character: range.start.character, line: range.start.line },
        { character: endBlockCharacter, line: endBlockLine }
      );

      if (range.start.line >= endBlockLine) {
        return;
      }

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
          .match(/^class\s*.*/)
      ) {
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
}

export default PydocstringCodeActionProvider;
