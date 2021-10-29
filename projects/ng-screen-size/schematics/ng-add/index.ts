import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { Schema } from './schema';

interface PackageJson {
    dependencies: Record<string, string>;
}

function sortObjectByKeys(obj: Record<string, string>) {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {} as Record<string, string>);
}

// Just return the tree
export function ngAdd(options: Schema): Rule {
    return async (host: Tree, context: SchematicContext) => {
        if (!host.exists('package.json')) {
            throw new SchematicsException(`No package.json found`);
        }

        const packageJson = JSON.parse(host.read('package.json')!.toString('utf8')) as PackageJson;
        const angularVersion = packageJson?.dependencies?.['@angular/core'];

        if (!angularVersion) {
            throw new SchematicsException(`Angular is not installed`);
        }

        if (!packageJson.dependencies['@angular/cdk']) {
            packageJson.dependencies['@angular/cdk'] = angularVersion;
        }
        packageJson.dependencies = sortObjectByKeys(packageJson.dependencies);

        host.overwrite('package.json', JSON.stringify(packageJson, null, 2));

        const installTaskId = context.addTask(new NodePackageInstallTask());

        context.addTask(new RunSchematicTask('ng-add-setup-project', options), [installTaskId]);
    };
}