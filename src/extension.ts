// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// context.subscriptions.push(
	// 	vscode.commands.registerCommand('csharp-copywith.messageHelloAct', messageHelloAct)
	// );

	context.subscriptions.push(
		vscode.commands.registerCommand('csharp-copywith.generateCopyWith', generateCopyWith)
	);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('csharp', new CSharpCodeActionProvider())
	);
}

class CSharpCodeActionProvider implements vscode.CodeActionProvider {

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection): vscode.CodeAction[] {
		const actions: vscode.CodeAction[] = [];
		// Generate CopyWith method action
		const copyWithAction = new vscode.CodeAction('Generate data class methods', vscode.CodeActionKind.QuickFix);
		copyWithAction.command = {
			command: 'csharp-copywith.generateCopyWith',
			title: 'Generate data class methods',
			arguments: [document, range]
		};
		actions.push(copyWithAction);

		// const messageHelloAct = new vscode.CodeAction('messageHelloAct', vscode.CodeActionKind.QuickFix);
		// messageHelloAct.command = {
		// 	command: 'csharp-copywith.messageHelloAct',
		// 	title: 'messageHelloAct',
		// 	arguments: [document, range]
		// };
		// actions.push(messageHelloAct);
		return actions;
	}
}


// This method is called when your extension is deactivated
export function deactivate() { }

// export async function messageHelloAct(document: vscode.TextDocument, range: vscode.Range | vscode.Selection) {
// 	const csharpCode = `
// 	private int _myField;
// 	public int MyProperty { get; set; }
// 	public string Name { get; set; } = "John";
// 	public int Age = 30;
// `;

// 	const regex = /(?:\b(?:public|private|protected|internal|static|const|new|virtual|override|readonly|extern)\s+)?(?:\b\w+\s+)*\b\w+\s+\b\w+\s*(?:{\s*(?:get;\s*set;|set;\s*get;)\s*}|=.*;|\(.*\));/g;
// 	let match= regex.exec(csharpCode);

// 	// while ((match = regex.exec(csharpCode)) !== null) {
// 	// 	vscode.window.showInformationMessage('Printed "Hello" at the end of the class.');
// 	// }
// 	vscode.window.showInformationMessage('Found:'+match?.length);

// }

function toPropertyName(x: string): string {
	return x.charAt(0).toUpperCase() + x.slice(1);
}
export async function generateCopyWith(document: vscode.TextDocument, range: vscode.Range | vscode.Selection) {

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const text = document.getText(range);
		const classNameMatch = text.match(/class\s+(\w+)\s*{/);
		if (!classNameMatch) {
			return [];
		}

		const className = classNameMatch[1];
		const regex = /public\s+(\w+)\s+(\w+)\s*;/g;
		// /(?:\b(?:public|private|protected|internal|static|const|new|virtual|override|readonly|extern)\s+)?(?:\b\w+\s+)*\b\w+\s+\b\w+\s*(?:{\s*(?:get;\s*set;|set;\s*get;)\s*}|=.*;|\(.*\));/g;

		const properties = [...text.matchAll(regex)];

		let classProps = `// Properties \n`;
		classProps += properties.map(p => `public ${p[1]} ${toPropertyName(p[2])} {get; private set;}`).join('\n');
		classProps += '\n';

		let constructor = `\npublic ${className}(`;
		constructor += properties.map(p => `${p[1]} ${p[2]}`).join(', ') + ') {\n';
		constructor += properties.map(p => `    this.${toPropertyName(p[2])} = ${p[2]};`).join('\n') + '\n';
		constructor += '}\n';

		// Generate CopyWith method
		let copyWithMethod = `\npublic ${className} CopyWith({ `;
		copyWithMethod += properties.map(p => `${p[1]}? ${p[2]} = null`).join(', ') + ' }) {\n';
		copyWithMethod += `    return new ${className} {\n`;
		copyWithMethod += properties.map(p => `        ${toPropertyName(p[2])} = ${p[2]} ?? this.${toPropertyName(p[2])}`).join(',\n') + '\n';
		copyWithMethod += '    };\n';
		copyWithMethod += '}\n';

		// Generate ToString method
		let toStringMethod = `\npublic override string ToString() {\n`;
		toStringMethod += `    return $"${className} { `;
		toStringMethod += properties.map(p => `${toPropertyName(p[2])} = {${toPropertyName(p[2])}}`).join(', ') + ' }";\n';
		toStringMethod += '}\n';


		let finalClass = `public class ${className}{\n`;
		finalClass += classProps + constructor + copyWithMethod + toStringMethod;
		finalClass += `\n}`

		editor.edit(editBuilder => {
			editBuilder.replace(new vscode.Range(range.start, range.end), finalClass);
		});

		vscode.commands.executeCommand('editor.action.formatDocument');


		//await document.save();

		// Notify user
		vscode.window.showInformationMessage('Successfully generated Data Class...');
	}

}