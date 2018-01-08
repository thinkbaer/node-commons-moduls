export interface IModuleRegistryOptions {

  packageFilter?: (packageJson: any) => boolean;

  paths: string[]

  //skipCheck: string[]

  depth?: number

  module?: NodeModule
}
