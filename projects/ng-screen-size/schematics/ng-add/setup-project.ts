import {
    Rule, Tree, SchematicsException, apply, url, applyTemplates, move,
    chain, mergeWith
} from '@angular-devkit/schematics';
import { getWorkspace, updateWorkspace } from '@schematics/angular/utility/workspace';
import { addImportToModule, insertImport, addProviderToModule } from '@schematics/angular/utility/ast-utils';
import { ProjectType } from '@schematics/angular/utility/workspace-models';
import { InsertChange } from '@schematics/angular/utility/change';
import { Schema } from './schema';
import { ProjectDefinition } from '@angular-devkit/core/src/workspace';
import { PathFragment, Path, strings, normalize } from '@angular-devkit/core';
import * as ts from 'typescript';

const getProviderTemplate = (path: string) => `{
    provide:  ScreenSizeBreakpointVariables,
    useValue:  '${path}',
}`;

function getAppTargetOptions(
    project: ProjectDefinition,
    buildTarget: string,
): Record<string, any> | undefined {
    return project.targets?.get(buildTarget)?.options;
}

function getAppModule(
    host: Tree,
    project: ProjectDefinition,
): Path {
    const mainPath: string = getAppTargetOptions(project, 'build')?.main;
    if (!mainPath) {
        throw new SchematicsException(
            `Could not find the application's main file inside of the workspace config (${project.sourceRoot})`,
        );
    }

    const mainBuffer = host.read(mainPath);
    if (!mainBuffer) {
        throw new SchematicsException(`Main file (${mainPath}) not found`);
    }

    const mainText = mainBuffer.toString('utf-8');
    const moduleName = /bootstrapModule\((.*)\)/g.exec(mainText)?.[1].trim();
    if (!moduleName) {
        throw new SchematicsException(`Could not find bootstrapped module name`);
    }

    let modulePath = new RegExp(`${moduleName}.*from(.*);`).exec(mainText)?.[1].trim();
    if (!modulePath) {
        throw new SchematicsException(`Could not find bootstrapped module path`);
    }
    modulePath = modulePath.replace(/\'/g, '').replace(/\"/g, '');
    if (!modulePath.endsWith('.ts')) {
        modulePath += '.ts';
    }

    return host.getDir(mainPath.split('/').slice(0, -1).join('/') || '.').file(modulePath as PathFragment)!.path;
}

function readFile(host: Tree, path: Path): { path: string, text: string, source: ts.SourceFile } {
    const text = host.read(path)!.toString('utf-8');
    if (text === null) {
        throw new SchematicsException(`Could not read module by path: ${path}.`);
    }
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    return { path, text, source };
}

export default function (options: Schema): Rule {
    return async (host: Tree) => {
        const workspace = await getWorkspace(host);
        if (!options.project) {
            if (!workspace.extensions.defaultProject) {
                throw new SchematicsException(`No project specified and default project not set in angular.json`);
            }
            options.project = workspace.extensions.defaultProject as string;
        }

        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new SchematicsException(`Invalid project name: ${options.project}`);
        }

        if (project.extensions.projectType !== ProjectType.Application) {
            throw new SchematicsException(`Project is not an application: ${options.project}`);
        }

        const modulePath = getAppModule(host, project);

        const rules = [addModule(modulePath)]

        if (options.path) {
            let [assetName, ...rest] = options.path.split('/').reverse();
            let assetDirectory = rest.reverse().join('/') || '.';
            rules.push(addAssets(options.project, options.path));
            rules.push(addStylePreprocessor(options.project, assetDirectory));
            rules.push(addProvider(modulePath, options.path));
            rules.push(addFile(assetDirectory, assetName));
        }

        return chain(rules);
    }
}

function addModule(modulePath: Path): Rule {
    return async (host: Tree) => {
        const moduleFile = readFile(host, modulePath);
        const changes = addImportToModule(moduleFile.source, moduleFile.path, 'NgScreenSizeModule', 'ng-screen-size');
        const recorder = host.beginUpdate(moduleFile.path);
        for (const change of changes) {
            if (change instanceof InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(recorder);
    }
}

function addProvider(modulePath: Path, filePath: string): Rule {
    return async (host: Tree) => {
        const moduleFile = readFile(host, modulePath);
        const changes = [
            insertImport(moduleFile.source, moduleFile.path, 'ScreenSizeBreakpointVariables', 'ng-screen-size'),
            ...addProviderToModule(moduleFile.source, moduleFile.path, getProviderTemplate(filePath.replace('src/', '')), null as any)
        ];
        const recorder = host.beginUpdate(moduleFile.path);
        for (const change of changes) {
            if (change instanceof InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(recorder);
    }
}

function addAssets(
    projectName: string,
    assetPath: string,
): Rule {
    return updateWorkspace(workspace => {
        const project = workspace.projects.get(projectName) as ProjectDefinition;
        const options = [getAppTargetOptions(project, 'build'), getAppTargetOptions(project, 'test')].filter(option => option !== undefined) as Record<string, any>[];
        options.forEach(option => {
            const assets = option.assets as (string | { input: string })[];

            if (!assets) {
                option.assets = [assetPath];
            } else {
                const existingStyles = assets.map(asset => (typeof asset === 'string' ? asset : asset.input));
                if (existingStyles.includes(assetPath)) {
                    return;
                }
                assets.unshift(assetPath);
            }
        })
    });
}

function addStylePreprocessor(
    projectName: string,
    assetDirectory: string,
): Rule {
    return updateWorkspace(workspace => {
        const project = workspace.projects.get(projectName) as ProjectDefinition;
        const options = [getAppTargetOptions(project, 'build'), getAppTargetOptions(project, 'test')].filter(option => !!option) as Record<string, any>[];
        options.forEach(option => {
            const preprocessor = option.stylePreprocessorOptions as { includePaths: string[] };
            if (!preprocessor) {
                option.stylePreprocessorOptions = { includePaths: [assetDirectory] }
            } else {
                if (!preprocessor.includePaths) {
                    preprocessor.includePaths = [assetDirectory];
                } else {
                    if (!preprocessor.includePaths.includes(assetDirectory)) {
                        preprocessor.includePaths.push(assetDirectory);
                    }
                }
            }
        })
    });
}

function addFile(directory: string, name: string): Rule {
    return async () => {
        const templateSource = apply(url('./files'), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                name
            }),
            move(normalize(directory))
        ]);

        return mergeWith(templateSource);
    }
}