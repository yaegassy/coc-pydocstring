import { Range, TextDocument, Uri, window, workspace, ExtensionContext, OutputChannel } from 'coc.nvim';

import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

export async function doFormat(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  document: TextDocument,
  range?: Range
): Promise<string> {
  if (document.languageId !== 'python') {
    throw 'doq cannot run, not a python file';
  }

  const extensionConfig = workspace.getConfiguration('pydocstring');

  const formatterOption = extensionConfig.get('formatter', 'sphinx');
  const isIgnoreException = extensionConfig.get('ignoreException', false);
  const isIgnoreYield = extensionConfig.get('ignoreYield', false);

  let doqPath = extensionConfig.get('doqPath', '');
  if (!doqPath) {
    if (fs.existsSync(path.join(context.storagePath, 'doq', 'venv', 'bin', 'doq'))) {
      doqPath = path.join(context.storagePath, 'doq', 'venv', 'bin', 'doq');
    } else {
      throw 'Unable to find the doq.';
    }
  }

  const fileName = Uri.parse(document.uri).fsPath;
  const text = document.getText();

  const args: string[] = [];
  const opts = { cwd: path.dirname(fileName) };

  args.push('-w');

  args.push('--formatter', formatterOption);

  if (isIgnoreException) {
    args.push('--ignore_exception');
  }

  if (isIgnoreYield) {
    args.push('--ignore_yield');
  }

  if (range?.start) {
    args.push('--start', (range.start.line + 1).toString());
  }

  if (range?.end) {
    args.push('--end', (range.end.line + 1).toString());
  }

  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, text);

  // ---- Output the command to be executed to channel log. ----
  outputChannel.appendLine(`${'#'.repeat(10)} pydocstring exec\n`);
  outputChannel.appendLine(`Run: ${doqPath} ${args.join(' ')} ${tmpFile.name}\n`);
  outputChannel.appendLine(`doqPath: ${doqPath}\n`);
  outputChannel.appendLine(`args: ${args.join(' ')} ${tmpFile.name}\n`);
  outputChannel.appendLine(`tmpFile: ${tmpFile.name}\n`);

  return new Promise(function (resolve) {
    cp.execFile(doqPath, [...args, '-f', tmpFile.name], opts, function (err) {
      if (err) {
        tmpFile.removeCallback();

        if (err.code === 'ENOENT') {
          window.showErrorMessage('Unable to find the doq tool.');
          throw err;
        }

        window.showErrorMessage('There was an error while running doq.');
        throw err;
      }

      const text = fs.readFileSync(tmpFile.name, 'utf-8');
      tmpFile.removeCallback();

      resolve(text);
    });
  });
}

export function fullDocumentRange(document: TextDocument): Range {
  const lastLineId = document.lineCount - 1;
  const doc = workspace.getDocument(document.uri);

  return Range.create({ character: 0, line: 0 }, { character: doc.getline(lastLineId).length, line: lastLineId });
}
