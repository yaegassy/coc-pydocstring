import { commands, ExtensionContext, window, workspace, languages, TextEdit, Range, TextDocument } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import which from 'which';

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
    if (
      fs.existsSync(path.join(context.storagePath, 'doq', 'venv', 'Scripts', 'doq.exe')) ||
      fs.existsSync(path.join(context.storagePath, 'doq', 'venv', 'bin', 'doq'))
    ) {
      if (process.platform === 'win32') {
        doqPath = path.join(context.storagePath, 'doq', 'venv', 'Scripts', 'doq.exe');
      } else {
        doqPath = path.join(context.storagePath, 'doq', 'venv', 'bin', 'doq');
      }
    }
  }

  let builtinInstallPythonCommand = extensionConfig.get('builtin.pythonPath', '');
  if (!builtinInstallPythonCommand) {
    const isRealpath = true;
    builtinInstallPythonCommand = getPythonCommand(isRealpath);
  }

  if (!doqPath) {
    if (builtinInstallPythonCommand) {
      await installWrapper(builtinInstallPythonCommand, context);
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

  context.subscriptions.push(
    commands.registerCommand('pydocstring.install', async () => {
      if (builtinInstallPythonCommand) {
        await installWrapper(builtinInstallPythonCommand, context);
      } else {
        window.showErrorMessage('python3/python command not found');
      }
    })
  );

  const languageSelector = [{ language: 'python', scheme: 'file' }];
  const actionProvider = new PydocstringCodeActionProvider(outputChannel);
  context.subscriptions.push(languages.registerCodeActionProvider(languageSelector, actionProvider, 'pydocstring'));
}

async function installWrapper(pythonCommand: string, context: ExtensionContext) {
  const msg = 'Install/Upgrade "doq"?';

  let ret = 0;
  ret = await window.showQuickpick(['Yes', 'Cancel'], msg);
  if (ret === 0) {
    try {
      await doqInstall(pythonCommand, context);
    } catch (e) {
      return;
    }
  } else {
    return;
  }
}

function getPythonCommand(isRealpath?: boolean): string {
  let res = '';

  try {
    res = which.sync('python3');
    if (isRealpath) {
      res = fs.realpathSync(res);
    }
    return res;
  } catch (e) {
    // noop
  }

  try {
    res = which.sync('python');
    if (isRealpath) {
      res = fs.realpathSync(res);
    }
    return res;
  } catch (e) {
    // noop
  }

  return res;
}
