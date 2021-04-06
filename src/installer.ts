import { ExtensionContext, window } from 'coc.nvim';

import path from 'path';

import rimraf from 'rimraf';
import child_process from 'child_process';
import util from 'util';

const exec = util.promisify(child_process.exec);

export async function doqInstall(context: ExtensionContext): Promise<void> {
  const pathVenv = path.join(context.storagePath, 'doq', 'venv');
  const pathPip = path.join(pathVenv, 'bin', 'pip');

  const statusItem = window.createStatusBarItem(0, { progress: true });
  statusItem.text = `Install doq ...`;
  statusItem.show();

  rimraf.sync(pathVenv);
  try {
    window.showMessage(`Install doq ...`);
    await exec(`python3 -m venv ${pathVenv} && ` + `${pathPip} install -U pip doq`);
    statusItem.hide();
    window.showMessage(`doq: installed!`);
  } catch (error) {
    statusItem.hide();
    window.showErrorMessage(`doq: install failed. | ${error}`);
    throw new Error();
  }
}
