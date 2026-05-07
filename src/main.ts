import axios, { AxiosInstance } from 'axios'

interface Options {
  debug?: boolean
  cache?: boolean
  external?: any
  dependencyMap?: Record<string, string>
}

class UmdImporter {
  private fetcher: AxiosInstance
  private readonly allPackages: any = {}
  private readonly options: Options = {}
  private readonly cachedPromise: Record<string, Promise<any> | undefined> = {}
  private external: any = {}
  private dependencyMap: Record<string, string> = {}
  private loadingStack: string[] = []

  constructor(options: Options = {}) {
    this.fetcher = axios.create({ timeout: 30000, maxContentLength: 10 * 1024 * 1024 })
    this.options = options
    this.external = options?.external || {}
    this.dependencyMap = options?.dependencyMap || {}
  }

  private log(...params: any[]) {
    if (this.options.debug) {
      console.log(...params)
    }
  }

  public async import<T = unknown>(url: string, globalPackageName?: string): Promise<T> {
    if (!/^https?:\/\/.+/.test(url)) throw new Error(`Invalid URL: ${url}`)
    const packageName = globalPackageName || this.getName(url, globalPackageName)
    if (packageName === 'index') console.warn('Your link is not end with package name. Importer will not auto generate unique packageName. You MUST specify a packageName as the second argument.')
    let resPromise
    if (this.options.cache) {
      if (this.cachedPromise[url]) {
        resPromise = this.cachedPromise[url]
        this.log(`import ${url} as ${packageName} from cache hit`)
      } else {
        resPromise = this.loadPackage(url, packageName)
        this.log(`import ${url} as ${packageName} from cache not hit fallback http`)
      }
      this.cachedPromise[url] = resPromise
    } else {
      resPromise = this.loadPackage(url, packageName)
      this.log(`import ${url} as ${packageName} from http no cache`)
    }
    try {
      const res = await resPromise
      return res != null && typeof res === 'object' ? { ...res } : res
    } catch (e) {
      // only cache succeed promise
      delete this.cachedPromise[url]
      throw e
    }
  }

  private async loadPackage(url: string, packageName: string) {
    const { data: jsContent } = await this.fetcher.get(url)
    await this.preloadDependencies(jsContent)
    this.execute(packageName, jsContent)
    return this.allPackages[packageName]?.module?.exports ||
      this.allPackages[packageName]?.exports
  }

  private async preloadDependencies(code: string) {
    const deps = this.extractRequireDeps(code)
    const missing = deps.filter(dep =>
      !this.external[dep] && !this.allPackages[dep] && this.dependencyMap[dep]
    )
    await Promise.all(missing.map(dep =>
      this.import(this.dependencyMap[dep], dep).catch(() => {
        // Silently fail pre-fetch — require() will throw its own error if needed
      })
    ))
  }

  private extractRequireDeps(code: string): string[] {
    const re = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    const deps: string[] = []
    let match: RegExpExecArray | null
    while ((match = re.exec(code)) !== null) {
      const dep = match[1]
      if (!deps.includes(dep)) deps.push(dep)
    }
    return deps
  }

  private execute(packageName: string, code: string) {
    this.detectESM(packageName, code)
    const functionBody = `with(ctx){eval(${JSON.stringify(code)})}${this.options.debug ? `//# sourceURL=${packageName}` : ''}\n`
    const fn = new Function('ctx', functionBody)
    const exp = {}
    this.allPackages[packageName] = {
      exports: exp,
      module: { exports: exp },
      require: this.umdRequireFactory(packageName),
      // Sandbox: shadow dangerous browser globals to prevent UMD code from accessing them
      window: undefined,
      document: undefined,
      navigator: undefined,
      location: undefined,
      fetch: undefined,
      XMLHttpRequest: undefined,
      localStorage: undefined,
      sessionStorage: undefined,
      setTimeout: undefined,
      setInterval: undefined,
      self: undefined
    }
    this.loadingStack.push(packageName)
    const ctx = this.allPackages[packageName]
    try {
      return fn.call(ctx, ctx)
    } finally {
      this.loadingStack.pop()
    }
  }

  private detectESM(packageName: string, code: string) {
    if (/\bexport\s+(default\s+|const\s+|let\s+|var\s+|function\s+|class\s+|\{)/.test(code) ||
        /\bimport\s+(\{|[\s\S]*?\bfrom\b)/.test(code)) {
      throw new Error(`ESM module detected in "${packageName}": export/import statements are not supported by eval()-based UMD importer`)
    }
  }

  private umdRequireFactory = (packageName: string) => (depName: string) => {
    this.log(`${packageName} require(${depName})`)
    if (this.loadingStack.includes(depName)) {
      throw new Error(`Circular dependency detected: ${packageName} -> ${depName}`)
    }
    const pkg = this.external[depName] ||
      this.allPackages[depName]?.module?.exports ||
      this.allPackages[depName]?.exports
    if (!pkg) {
      const urlHint = this.dependencyMap[depName]
        ? ` Add "${depName}" to dependencyMap (URL: ${this.dependencyMap[depName]}) to auto-fetch.`
        : ''
      throw new Error(`Dependency "${depName}" required by "${packageName}" not found.${urlHint}`)
    }
    return pkg
  }

  private getName(url: string, packageName?: string) {
    if (packageName) return packageName
    const urlFragments = url.split('/')
    const filename = urlFragments[urlFragments.length - 1].split('?')[0].split('#')[0]
    const nameFragments = filename.split('.')
    return nameFragments[0]
  }

  public unload(packageName: string) {
    delete this.allPackages[packageName]
  }

  public clear() {
    Object.keys(this.allPackages).forEach(key => delete this.allPackages[key])
    Object.keys(this.cachedPromise).forEach(key => delete this.cachedPromise[key])
  }
}

export default UmdImporter
