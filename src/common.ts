import { ExtensionContext, Range, TextDocument, workspace } from 'coc.nvim';
import fs from 'fs';
import path from 'path';
import which from 'which';

export function fullDocumentRange(document: TextDocument): Range {
  const lastLineId = document.lineCount - 1;
  const doc = workspace.getDocument(document.uri);

  return Range.create({ character: 0, line: 0 }, { character: doc.getline(lastLineId).length, line: lastLineId });
}

export function getDoqPath(context: ExtensionContext) {
  // Priority to detect doq
  //
  // 1. pydocstring.doqPath setting
  // 2. PATH environment (e.g. system global PATH or venv, etc ...)
  // 3. extension venv (buit-in)

  let doqPath = workspace.getConfiguration('pydocstring').get('doqPath', '');

  if (!doqPath) {
    const whichDoq = whichCmd('doq');
    if (whichDoq) {
      doqPath = whichDoq;
    } else if (
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

  return doqPath;
}

export function getPythonCommand(isRealpath?: boolean): string {
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

export function whichCmd(cmd: string): string {
  try {
    return which.sync(cmd);
  } catch (error) {
    return '';
  }
}
