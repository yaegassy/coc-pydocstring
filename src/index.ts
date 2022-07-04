import { commands, ExtensionContext, window, workspace } from 'coc.nvim';

import fs from 'fs';

import * as doqCodeActionFeature from './action';
import * as installCommandFeature from './commands/install';
import * as runActionInternalCommandFeature from './commands/runAction';
import * as runFileCommandFeature from './commands/runFile';
import * as showOutputCommandFeature from './commands/showOutput';
import { getDoqPath, getPythonCommand } from './common';

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

  runFileCommandFeature.activate(context, outputChannel);
  // internal command
  runActionInternalCommandFeature.activate(context, outputChannel);

  doqCodeActionFeature.activate(context, outputChannel);
}
