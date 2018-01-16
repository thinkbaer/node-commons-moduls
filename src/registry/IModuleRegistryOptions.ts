export interface IModuleRegistryOptions {

  packageFilter?: (packageJson: any) => boolean;

  paths: string[]

  //skipCheck: string[]

  depth?: number

  module?: NodeModule

  /**
   * how should error be handled for already existsing moduls
   */
  handleErrorOnDuplicate?:'log' | 'skip' | 'throw'
}
