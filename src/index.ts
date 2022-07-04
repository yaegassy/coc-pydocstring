import { commands, ExtensionContext, Range, TextDocument, TextEdit, window, workspace } from 'coc.nvim';

import fs from 'fs';

import * as docCodeActionFeature from './action';
import * as showOutputCommandFeature from './commands/showOutput';
import * as installCommandFeature from './commands/install';
import { doFormat } from './doqEngine';
import { getDoqPath, getPythonCommand, fullDocumentRange } from './common';

export async function activate(context: ExtensionContext): Promise<void> {
  const extensionConfig = workspace.getConfiguration('pydocstring');
  const isEnable = extensionConfig.get<boolean>('enable', true);
  if (!isEnable) return;

  const outputChannel = window.createOutputChannel('pydocstring');
  showOutputCommandFeature.activate(context, outputChannel);

  const extensionStoragePath = context.storagePath;
  if (!fs.existsSync(extensionStoragePath)) {
    fs.mkdirSync(extensionStoragePath);
  }

  const doqPath = getDoqPath(context);

  let builtinInstallPythonCommand = extensionConfig.get('builtin.pythonPath', '');
  if (!builtinInstallPythonCommand) {
    const isRealpath = true;
    builtinInstallPythonCommand = getPythonCommand(isRealpath);
  }

  installCommandFeature.activate(context, builtinInstallPythonCommand);

  if (!doqPath) {
    if (builtinInstallPythonCommand) {
      commands.executeCommand('pydocstring.install');
    } else {
      window.showErrorMessage('python3/python command not found');
    }
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

  docCodeActionFeature.activate(context, outputChannel);
}
