import axios, {AxiosInstance} from 'axios'

class UmdImporter {
  private fetcher: AxiosInstance
  private readonly allPackages: any = {}
  private readonly options: { debug?: boolean } = {}

  constructor(options: { debug?: boolean } = {}) {
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
    this.log(`import ${url} as ${packageName}`)
    const {data: jsContent} = await this.fetcher.get(url)
    this.execute(packageName, jsContent)
    return this.allPackages[packageName].exports
  }

  private execute(packageName: string, code: string) {
    const functionBody = `with(ctx){${code}}//# sourceURL=[module]\n`
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
    return this.allPackages[depName]?.exports
  }

  private getName(url: string, packageName?: string) {
    if (packageName) return packageName
    const urlFragments = url.split('/')
    const nameFragments = urlFragments[urlFragments.length - 1].split('.')
    return nameFragments[0]
  }
}

export default UmdImporter
