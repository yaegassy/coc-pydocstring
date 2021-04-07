import { commands, ExtensionContext, window, workspace, languages, TextEdit, Range, TextDocument } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { doFormat, fullDocumentRange } from './doqEngine';
import PydocstringCodeActionProvider from './action';
import { doqInstall } from './installer';

export async function activate(context: ExtensionContext): Promise<void> {
  const extensionConfig = workspace.getConfiguration('pydocstring');
  const isEnable = extensionConfig.get<boolean>('enable', true);
  if (!isEnable) return;

  const outputChannel = window.createOutputChannel('pydocstring');

  const extensionStoragePath = context.storagePath;
  if (!fs.existsSync(extensionStoragePath)) {
    fs.mkdirSync(extensionStoragePath);
  }

  let doqPath = extensionConfig.get('doqPath', '');
  if (!doqPath) {
    if (fs.existsSync(path.join(context.storagePath, 'doq', 'venv', 'bin', 'doq'))) {
      doqPath = path.join(context.storagePath, 'doq', 'venv', 'bin', 'doq');
    }
  }

  if (!doqPath) {
    await installWrapper(context);
  }

  context.subscriptions.push(
    commands.registerCommand('pydocstring.runFile', async () => {
      const doc = await workspace.document;

      const code = await doFormat(context, outputChannel, doc.textDocument, undefined);
      const edits = [TextEdit.replace(fullDocumentRange(doc.textDocument), code)];
      if (edits) {
        await doc.applyEdits(edits);
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand(
      'pydocstring.runAction',
      async (document: TextDocument, range?: Range) => {
        const doc = workspace.getDocument(document.uri);

        let edits: TextEdit[];

        const code = await doFormat(context, outputChannel, document, range);
        if (!range) {
          range = fullDocumentRange(document);
          edits = [TextEdit.replace(range, code)];
          if (edits) {
            return await doc.applyEdits(edits);
          }
        }

        let endLine = range.end.line;
        let endCharacter = doc.getline(range.end.character).length;

        const startLineFullLength = doc.getline(range.start.line).length;
        const startLineTrimLength = doc.getline(range.start.line).trim().length;
        const startLineIndentLength = startLineFullLength - startLineTrimLength;

        const endLineFullLength = doc.getline(endLine).length;
        const endLineTrimLength = doc.getline(endLine).trim().length;
        const endLineIndentLength = endLineFullLength - endLineTrimLength;
        endCharacter = range.end.character + endLineIndentLength;

        // For class, adjust
        if (doc.getline(range.start.line).match(/\s*class\s*.*:/)) {
          endCharacter = 0;
          endLine = range.end.line + 1;
        }

        // Resove range
        range = Range.create(
          { line: range.start.line, character: range.start.character - startLineIndentLength },
          { line: endLine, character: endCharacter }
        );

        // If there are no changes to the text, early return
        if (document.getText() === code) {
          return;
        }

        edits = [TextEdit.replace(range, code)];
        if (edits) {
          return await doc.applyEdits(edits);
        }
      },
      null,
      true
    )
  );

  context.subscriptions.push(
    commands.registerCommand('pydocstring.install', async () => {
      await installWrapper(context);
    })
  );

  const languageSelector = [{ language: 'python', scheme: 'file' }];
  const actionProvider = new PydocstringCodeActionProvider();
  context.subscriptions.push(languages.registerCodeActionProvider(languageSelector, actionProvider, 'pydocstring'));
}

async function installWrapper(context: ExtensionContext) {
  const msg = '"doq" is not found, install "doq"?';

  let ret = 0;
  ret = await window.showQuickpick(['Yes', 'Cancel'], msg);
  if (ret === 0) {
    try {
      await doqInstall(context);
    } catch (e) {
      return;
    }
  } else {
    return;
  }
}
