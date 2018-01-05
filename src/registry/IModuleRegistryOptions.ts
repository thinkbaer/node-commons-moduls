export interface IModuleRegistryOptions {

    packageFilter?: (packageJson: any) => boolean;

    paths: string[]

    depth?: number

    module?: NodeModule
}
