"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const cats = {
    'Coding Cat': 'https://www.w3schools.com/tags/tag_iframe.ASP',
    'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
    'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif'
};
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('catCoding.start', () => {
        CatCodingPanel.createOrShow(context.extensionUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('catCoding.doRefactor', () => {
        if (CatCodingPanel.currentPanel) {
            CatCodingPanel.currentPanel.doRefactor();
        }
    }));
    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                console.log(`Got state: ${state}`);
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
                CatCodingPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}
exports.activate = activate;
function getWebviewOptions(extensionUri) {
    return {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}
/**
 * Manages cat coding webview panels
 */
class CatCodingPanel {
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (CatCodingPanel.currentPanel) {
            CatCodingPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(CatCodingPanel.viewType, 'Cat Coding', column || vscode.ViewColumn.One, getWebviewOptions(extensionUri));
        CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri);
    }
    static revive(panel, extensionUri) {
        CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    dispose() {
        CatCodingPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        // Vary the webview's content based on where it is located in the editor.
        switch (this._panel.viewColumn) {
            case vscode.ViewColumn.Two:
                this._updateForCat(webview, 'Compiling Cat');
                return;
            case vscode.ViewColumn.Three:
                this._updateForCat(webview, 'Testing Cat');
                return;
            case vscode.ViewColumn.One:
            default:
                this._updateForCat(webview, 'Coding Cat');
                return;
        }
    }
    _updateForCat(webview, catName) {
        this._panel.title = catName;
        this._panel.webview.html = this._getHtmlForWebview(webview, cats[catName]);
    }
    _getHtmlForWebview(webview, catGifPath) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Cat Coding</title>
			</head>
			<body>
				<h2>Arguments Reference</h2>
				<table>
				<tr>
					<th>Argument</th>
					<th>Description</th>
				</tr>
				<tr>
					<td><strong>name</strong></td>
					<td>(Required) The name of the Container Apps Managed Environment.</td>
				</tr>
				<tr>
					<td><strong>resource_group_name</strong></td>
					<td>(Required) The name of the Resource Group where this Container App Environment exists.</td>
				</tr>
				</table>
				
				<h2>Attributes Reference</h2>
				<table>
				<tr>
					<th>Attribute</th>
					<th>Description</th>
				</tr>
				<tr>
					<td><strong>id</strong></td>
					<td>The ID of the Container App Environment.</td>
				</tr>
				<tr>
					<td><strong>infrastructure_subnet_id</strong></td>
					<td>The ID of the Subnet in use by the Container Apps Control Plane. <br/><em>NOTE:</em> This will only be populated for Environments that have <code>internal_load_balancer_enabled</code> set to true.</td>
				</tr>
				<tr>
					<td><strong>default_domain</strong></td>
					<td>The default publicly resolvable name of this Container App Environment. This is generated at creation time to be globally unique.</td>
				</tr>
				<tr>
					<td><strong>docker_bridge_cidr</strong></td>
					<td>The network addressing in which the Container Apps in this Container App Environment will reside in CIDR notation. <br/><em>NOTE:</em> This will only be populated for Environments that have <code>internal_load_balancer_enabled</code> set to true.</td>
				</tr>
				<tr>
					<td><strong>internal_load_balancer_enabled</strong></td>
					<td>Does the Container App Environment operate in Internal Load Balancing Mode?</td>
				</tr>
				<tr>
					<td><strong>location</strong></td>
					<td>The Azure Location where this Container App Environment exists.</td>
				</tr>
				<tr>
					<td><strong>log_analytics_workspace_name</strong></td>
					<td>The name of the Log Analytics Workspace this Container Apps Managed Environment is linked to.</td>
				</tr>
				<tr>
					<td><strong>platform_reserved_cidr</strong></td>
					<td>The IP range, in CIDR notation, that is reserved for environment infrastructure IP addresses. <br/><em>NOTE:</em> This will only be populated for Environments that have <code>internal_load_balancer_enabled</code> set to true.</td>
				</tr>
				<tr>
					<td><strong>platform_reserved_dns_ip_address</strong></td>
					<td>The IP address from the IP range defined by <code>platform_reserved_cidr</code> that is reserved for the internal DNS server. <br/><em>NOTE:</em> This will only be populated for Environments that have <code>internal_load_balancer_enabled</code> set to true.</td>
				</tr>
				<tr>
					<td><strong>static_ip_address</strong></td>
					<td>The Static IP address of the Environment. <br/><em>NOTE:</em> If <code>internal_load_balancer_enabled</code> is true, this will be a Private IP in the subnet, otherwise this will be allocated a Public IPv4 address.</td>
				</tr>
				<tr>
					<td><strong>tags</strong></td>
					<td>A mapping of tags assigned to the resource.</td>
				</tr>
				</table>
				
				<h2>Timeouts</h2>
				<table>
				<tr>
					<th>Timeout</th>
					<th>Description</th>
				</tr>
				<tr>
					<td><strong>read</strong></td>
					<td>(Defaults to 5 minutes) Used when retrieving the Container App Environment.</td>
				</tr>
				</table>
			
				<h1 id="lines-of-code-counter">0</h1>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
CatCodingPanel.viewType = 'catCoding';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=extension.js.map