import { commands, ExtensionContext, OutputChannel, TextEdit, workspace } from 'coc.nvim';
import { fullDocumentRange } from '../common';
import { doFormat } from '../doqEngine';

export function activate(context: ExtensionContext, outputChannel: OutputChannel) {
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
}
