import { commands, ExtensionContext, OutputChannel, Range, TextDocument, TextEdit, workspace } from 'coc.nvim';
import { fullDocumentRange } from '../common';
import { doFormat } from '../doqEngine';

export function activate(context: ExtensionContext, outputChannel: OutputChannel) {
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
}
