export interface INpmlsOptions {
  filter?: (packageJson: any) => boolean
  depth: number
  level?: number
  subModulePaths?: string[]
}
