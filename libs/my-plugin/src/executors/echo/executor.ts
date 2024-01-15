import { ExecutorContext } from '@nrwl/devkit';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export default async function dependencyAnalyzerExecutor(
  options: never,
  context: ExecutorContext
) {
  // In case you need options
  console.log('Executor running for Dependency Analyzer', options);

  const projectRoot = context.workspace.projects[context.projectName].root;
  const rootPackageJsonPath = path.join(context.root, 'package.json');
  const rootPackageJson = JSON.parse(
    fs.readFileSync(rootPackageJsonPath, 'utf8')
  );

  const projectDependencies = new Set<string>();

  traverseDirectory(projectRoot, projectDependencies, rootPackageJson);

  updatePackageJson(projectDependencies, rootPackageJson, context);

  return { success: true };
}

function traverseDirectory(
  directory: string,
  projectDependencies: Set<string>,
  rootPackageJson: string
) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      traverseDirectory(fullPath, projectDependencies, rootPackageJson);
    } else if (stats.isFile() && /\.(ts|js)$/.test(file)) {
      analyzeFile(fullPath, projectDependencies);
    }
  });
}

function analyzeFile(filePath: string, projectDependencies: Set<string>) {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContents,
    ts.ScriptTarget.Latest,
    true
  );

  console.log(sourceFile);

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      console.log(
        'node.moduleSpecifier',
        node.moduleSpecifier.getText(sourceFile)
      );

      const importPath = node.moduleSpecifier
        .getText(sourceFile)
        .replace(/['"`]/g, '');

      console.log('importPath', importPath);

      if (!importPath.startsWith('.')) {
        projectDependencies.add(importPath);
      }
    }
  });
}

function updatePackageJson(
  dependencies: Set<string>,
  rootPackageJson: {
    dependencies: {
      [key: string]: string;
    };
  },
  context: ExecutorContext
) {
  const compiledPackageJsonPath = path.join(
    'dist',
    context.workspace.projects[context.projectName].root,
    'package.json'
  );

  let compiledPackageJson = {
    dependencies: {},
  };

  if (fs.existsSync(compiledPackageJsonPath)) {
    compiledPackageJson = JSON.parse(
      fs.readFileSync(compiledPackageJsonPath, 'utf8')
    );
  }

  compiledPackageJson.dependencies = compiledPackageJson.dependencies || {};

  dependencies.forEach((dep) => {
    if (rootPackageJson.dependencies && rootPackageJson.dependencies[dep]) {
      compiledPackageJson.dependencies[dep] = rootPackageJson.dependencies[dep];
    }
  });

  fs.writeFileSync(
    compiledPackageJsonPath,
    JSON.stringify(compiledPackageJson, null, 2)
  );
}
