import { ExtensionContext, window } from 'coc.nvim';

import path from 'path';

import rimraf from 'rimraf';
import child_process from 'child_process';
import util from 'util';

import { DOQ_VERSION } from './constant';

const exec = util.promisify(child_process.exec);

export async function doqInstall(pythonCommand: string, context: ExtensionContext): Promise<void> {
  const pathVenv = path.join(context.storagePath, 'doq', 'venv');

  let pathVenvPython = path.join(context.storagePath, 'doq', 'venv', 'bin', 'python');
  if (process.platform === 'win32') {
    pathVenvPython = path.join(context.storagePath, 'doq', 'venv', 'Scripts', 'python');
  }

  const statusItem = window.createStatusBarItem(0, { progress: true });
  statusItem.text = `Install doq...`;
  statusItem.show();

  rimraf.sync(pathVenv);
  try {
    window.showMessage(`Install doq...`);
    await exec(
      `${pythonCommand} -m venv ${pathVenv} && ` + `${pathVenvPython} -m pip install -U pip doq==${DOQ_VERSION}`
    );
    statusItem.hide();
    window.showMessage(`doq: installed!`);
  } catch (error) {
    statusItem.hide();
    window.showErrorMessage(`doq: install failed. | ${error}`);
    throw new Error();
  }
}
