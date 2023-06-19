import { ExtensionContext, OutputChannel, Range, TextDocument, Uri, window, workspace } from 'coc.nvim';

import cp from 'child_process';
import fs from 'fs';
import path from 'path';

import ini from 'ini';
import tmp from 'tmp';
import toml from 'toml';

import { getDoqPath } from './common';

type DoqTemplatePath = {
  doq?: {
    template_path?: string;
  };
};

type SetupCfgForDoqTemplatePath = DoqTemplatePath;

type PyprojectTomlForDoqTemplatePath = {
  tool?: DoqTemplatePath;
};

const WORKSPACE_PYPROJECT_TOML_PATH = path.join(workspace.root, 'pyproject.toml');
const WORKSPACE_SETUP_CFG_PATH = path.join(workspace.root, 'setup.cfg');

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
  // Use `workspace.expand` to accommodate the needs of `~` and `$HOME`.
  const templatePath = workspace.expand(extensionConfig.get<string>('templatePath', ''));
  const isIgnoreException = extensionConfig.get('ignoreException', false);
  const isIgnoreYield = extensionConfig.get('ignoreYield', false);
  const isIgnoreInit = extensionConfig.get('ignoreInit', false);

  const doqPath = getDoqPath(context);
  if (!doqPath) {
    throw 'Unable to find the doq';
  }

  const fileName = Uri.parse(document.uri).fsPath;
  const text = document.getText();

  const args: string[] = [];
  const opts = { cwd: path.dirname(fileName) };

  args.push('-w');

  args.push('--formatter', formatterOption);

  if (
    templatePath &&
    fs.existsSync(templatePath) &&
    fs.existsSync(path.join(templatePath, 'class.txt')) &&
    fs.existsSync(path.join(templatePath, 'def.txt')) &&
    fs.existsSync(path.join(templatePath, 'noarg.txt'))
  ) {
    if (templatePath.startsWith('/')) {
      // absolute path
      args.push('--template_path', templatePath);
    } else {
      // relative path
      args.push('--template_path', path.join(workspace.root, templatePath));
    }
  }

  const templatePathFromConfigFile = getDoqTemplatePathFromConfigFile();
  if (!templatePath && templatePathFromConfigFile) {
    args.push('--template_path', templatePathFromConfigFile);
  }

  if (isIgnoreException) {
    args.push('--ignore_exception');
  }

  if (isIgnoreYield) {
    args.push('--ignore_yield');
  }

  if (range === undefined) {
    if (isIgnoreInit) {
      args.push('--ignore_init');
    }
  }

  if (range?.start) {
    args.push('--start', (range.start.line + 1).toString());
  }

  if (range?.end) {
    args.push('--end', (range.end.line + 1).toString());
  }

  args.push('-f');

  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, text);

  // ---- Output the command to be executed to channel log. ----
  outputChannel.appendLine(`${'#'.repeat(10)} pydocstring exec\n`);
  outputChannel.appendLine(`Run: ${doqPath} ${args.join(' ')} ${tmpFile.name}`);
  outputChannel.appendLine(`doqPath: ${doqPath}`);
  outputChannel.appendLine(`args: ${args.join(' ')}`);
  outputChannel.appendLine(`tmpFile: ${tmpFile.name}\n`);

  return new Promise(function (resolve) {
    cp.execFile(doqPath, [...args, tmpFile.name], opts, function (err) {
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

      outputChannel.appendLine(`==== result ====:\n\n${text}`);
      resolve(text);
    });
  });
}

function getDoqTemplatePathFromConfigFile(): string | undefined {
  let templatePath: string | undefined;

  if (fs.existsSync(WORKSPACE_PYPROJECT_TOML_PATH)) {
    // pyproject.toml
    try {
      const fileStr = fs.readFileSync(WORKSPACE_PYPROJECT_TOML_PATH, { encoding: 'utf-8' });
      const data: PyprojectTomlForDoqTemplatePath = toml.parse(fileStr);
      if (data.tool?.doq?.template_path) {
        templatePath = data.tool.doq.template_path;
      }
    } catch (e) {
      window.showErrorMessage('Failed to load TOML file. There may be a syntax error.');
      throw e;
    }
  } else if (fs.existsSync(WORKSPACE_SETUP_CFG_PATH)) {
    // setup.cfg
    try {
      const fileStr = fs.readFileSync(WORKSPACE_SETUP_CFG_PATH, { encoding: 'utf-8' });
      const data: SetupCfgForDoqTemplatePath = ini.parse(fileStr);
      if (data.doq?.template_path) {
        templatePath = data.doq.template_path;
      }
    } catch (e) {
      window.showErrorMessage('Failed to load INI file. There may be a syntax error.');
      throw e;
    }
  }

  if (templatePath) {
    if (templatePath.startsWith('/')) {
      // absolute path
      return templatePath;
    } else {
      // relative path
      return path.join(workspace.root, templatePath);
    }
  }

  return templatePath;
}
