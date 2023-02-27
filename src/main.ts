import axios, { AxiosInstance } from 'axios'

interface Options {
  debug?: boolean
  cache?: boolean
}

class UmdImporter {
  private fetcher: AxiosInstance
  private readonly allPackages: any = {}
  private readonly options: Options = {}
  private readonly cachedPromise: Record<string, Promise<any> | undefined> = {}

  constructor(options: Options = {}) {
    this.fetcher = axios.create()
    this.options = options
  }

  private log(...params: any[]) {
    if (this.options.debug) {
      console.log(...params)
    }
  }

  public async import<T = unknown>(url: string, globalPackageName?: string): Promise<T> {
    const packageName = globalPackageName || this.getName(url, globalPackageName)
    if (packageName === 'index') console.warn('Your link is not end with package name. Importer will not auto generate unique packageName. You MUST specify a packageName as the second argument.')
    let resPromise
    if (this.options.cache) {
      if (this.cachedPromise[packageName]) {
        resPromise = this.cachedPromise[packageName]
        this.log(`import ${url} as ${packageName} from cache hit`)
      } else {
        resPromise = this.loadPackage(url, packageName)
        this.log(`import ${url} as ${packageName} from cache not hit fallback http`)
      }
      this.cachedPromise[packageName] = resPromise
    } else {
      resPromise = this.loadPackage(url, packageName)
      this.log(`import ${url} as ${packageName} from http no cache`)
    }
    try {
      const res = await resPromise
      return res
    } catch (e) {
      // only cache succeed promise
      delete this.cachedPromise[packageName]
      throw e
    }
  }

  private async loadPackage(url: string, packageName: string) {
    const { data: jsContent } = await this.fetcher.get(url)
    this.execute(packageName, jsContent)
    return this.allPackages[packageName]?.module?.exports ||
      this.allPackages[packageName]?.exports
  }

  private execute(packageName: string, code: string) {
    const functionBody = `with(ctx){eval(${JSON.stringify(code)})}${this.options.debug ? '//# sourceURL=[module]' : ''}\n`
    const fn = new Function('ctx', functionBody)
    this.allPackages[packageName] = {
      exports: {},
      module: {},
      require: this.umdRequireFactory(packageName)
    }
    const ctx = this.allPackages[packageName]
    return fn.call(ctx, ctx)
  }

  private umdRequireFactory = (packageName: string) => (depName: string) => {
    this.log(`${packageName} require(${depName})`)
    const pkg = this.allPackages[depName]?.module?.exports ||
      this.allPackages[depName]?.exports
    if (!pkg) throw `${depName} not found`
    return pkg
  }

  private getName(url: string, packageName?: string) {
    if (packageName) return packageName
    const urlFragments = url.split('/')
    const nameFragments = urlFragments[urlFragments.length - 1].split('.')
    return nameFragments[0]
  }
}

export default UmdImporter
