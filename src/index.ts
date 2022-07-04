import { commands, ExtensionContext, Range, TextDocument, TextEdit, window, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';
import which from 'which';

import * as docCodeActionFeature from './action';
import * as showOutputCommandFeature from './commands/showOutput';
import { doFormat, fullDocumentRange } from './doqEngine';
import { doqInstall } from './installer';

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

  const enableInstallPrompt = extensionConfig.get<boolean>('enableInstallPrompt', true);

  context.subscriptions.push(
    commands.registerCommand('pydocstring.install', async () => {
      if (builtinInstallPythonCommand) {
        await installWrapper(builtinInstallPythonCommand, context, enableInstallPrompt);
      } else {
        window.showErrorMessage('python3/python command not found');
      }
    })
  );

  if (!doqPath) {
    if (builtinInstallPythonCommand) {
      await installWrapper(builtinInstallPythonCommand, context, enableInstallPrompt);
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

async function installWrapper(pythonCommand: string, context: ExtensionContext, isPrompt: boolean) {
  if (isPrompt) {
    const msg = 'Install/Upgrade "doq"?';
    const ret = await window.showPrompt(msg);
    if (ret) {
      try {
        await doqInstall(pythonCommand, context);
      } catch (e) {
        return;
      }
    } else {
      return;
    }
  } else {
    await doqInstall(pythonCommand, context);
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
