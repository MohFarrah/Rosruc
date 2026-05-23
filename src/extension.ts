import * as vscode from "vscode";
import { OptimizerSidebarProvider } from "./OptimizerSidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new OptimizerSidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "dockerDevOptimizer.sidebar",
      provider,
    ),
    vscode.commands.registerCommand("dockerDevOptimizer.focusSidebar", async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.dockerDevOptimizer",
      );
    }),
  );
}

export function deactivate() {
  // Nothing to dispose manually.
}
