import { commands, ExtensionContext, window, workspace } from 'coc.nvim';
import { doqInstall } from '../installer';

export function activate(context: ExtensionContext, builtinInstallPythonCommand: string) {
  const enableInstallPrompt = workspace.getConfiguration('pydocstring').get<boolean>('enableInstallPrompt', true);

  context.subscriptions.push(
    commands.registerCommand('pydocstring.install', async () => {
      if (builtinInstallPythonCommand) {
        await installWrapper(context, builtinInstallPythonCommand, enableInstallPrompt);
      } else {
        window.showErrorMessage('python3/python command not found');
      }
    })
  );
}

export async function installWrapper(context: ExtensionContext, pythonCommand: string, isPrompt: boolean) {
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
