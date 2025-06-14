import * as fs from 'fs';
import * as path from 'path';

import {
    Service
} from "@cmmv/core";

@Service('health')
export class HealthService {
    async getHealth() {
        try {
            const healthInfo = await this.getSystemHealthInfo();
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                node_version: process.version,
                platform: process.platform,
                arch: process.arch,
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
                    external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100
                },
                ...healthInfo
            };
        } catch (error) {
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            };
        }
    }

    private async getSystemHealthInfo() {
        const packageJsonPath = path.resolve(process.cwd(), 'package.json');
        const nodeModulesPath = path.resolve(process.cwd(), "../../", 'node_modules');
        console.log(nodeModulesPath);

        let packageInfo = {};
        let cmmvPackages = {};
        let dependencies = {};

        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                packageInfo = {
                    name: packageData.name,
                    version: packageData.version,
                    description: packageData.description
                };
            }

            if (fs.existsSync(nodeModulesPath)) {
                const cmmvPath = path.join(nodeModulesPath, '@cmmv');

                if (fs.existsSync(cmmvPath)) {
                    const cmmvDirs = fs.readdirSync(cmmvPath, { withFileTypes: true })
                        .filter(dirent => dirent.isDirectory())
                        .map(dirent => dirent.name);

                    for (const dir of cmmvDirs) {
                        const packagePath = path.join(cmmvPath, dir, 'package.json');

                        if (fs.existsSync(packagePath)) {
                            try {
                                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                                cmmvPackages[`@cmmv/${dir}`] = {
                                    version: packageData.version,
                                    description: packageData.description
                                };
                            } catch (error) {
                                cmmvPackages[`@cmmv/${dir}`] = {
                                    version: 'unknown',
                                    error: 'Failed to read package.json'
                                };
                            }
                        }
                    }
                }
            }

            const installedDependencies = {};
            if (Object.keys(dependencies).length > 0) {
                for (const [depName, expectedVersion] of Object.entries(dependencies)) {
                    try {
                        const depPackagePath = path.join(nodeModulesPath, depName, 'package.json');

                        if (fs.existsSync(depPackagePath)) {
                            const depPackageData = JSON.parse(fs.readFileSync(depPackagePath, 'utf8'));
                            installedDependencies[depName] = {
                                expected: expectedVersion,
                                installed: depPackageData.version,
                                description: depPackageData.description
                            };
                        } else {
                            installedDependencies[depName] = {
                                expected: expectedVersion,
                                installed: 'not found',
                                description: null
                            };
                        }
                    } catch (error) {
                        installedDependencies[depName] = {
                            expected: expectedVersion,
                            installed: 'error reading',
                            description: null
                        };
                    }
                }
            }

            return {
                package: packageInfo,
                cmmv_packages: {
                    count: Object.keys(cmmvPackages).length,
                    packages: cmmvPackages
                }
            };

        } catch (error) {
            return {
                error: 'Failed to read system information',
                details: (error as Error).message
            };
        }
    }
}
