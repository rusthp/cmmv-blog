#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function incrementVersion(version, type = 'patch') {
    const parts = version.split('.').map(v => parseInt(v));

    switch (type) {
        case 'major':
            parts[0] += 1;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1] += 1;
            parts[2] = 0;
            break;
        case 'patch':
        default:
            parts[2] += 1;
            break;
    }

    return parts.join('.');
}

function setVersion(currentVersion, newVersion) {
    // Validate new version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(newVersion)) {
        throw new Error(`Invalid version format: ${newVersion}. Expected format: X.Y.Z`);
    }
    return newVersion;
}

function updatePackageVersion(packageJsonPath, options = {}) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const oldVersion = packageJson.version;

        if (options.setVersion) {
            packageJson.version = setVersion(oldVersion, options.setVersion);
        } else {
            packageJson.version = incrementVersion(oldVersion, options.type || 'patch');
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');
        console.log(`Updated ${path.relative(process.cwd(), packageJsonPath)}: ${oldVersion} -> ${packageJson.version}`);

        return packageJson.version;
    } catch (error) {
        console.error(`Error updating ${packageJsonPath}:`, error.message);
        return null;
    }
}

function findPackageJsonFiles(dir) {
    const packageJsonFiles = [];

    if (!fs.existsSync(dir)) {
        return packageJsonFiles;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            const packageJsonPath = path.join(itemPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                packageJsonFiles.push(packageJsonPath);
            }
        }
    }

    return packageJsonFiles;
}

function showHelp() {
    console.log(`
🚀 Version Bump Tool

Usage:
  node tools/version-bump.js [options]

Options:
  --type <type>     Increment type: major, minor, patch (default: patch)
  --set <version>   Set specific version (format: X.Y.Z)
  --help           Show this help message

Examples:
  node tools/version-bump.js                    # Increment patch version
  node tools/version-bump.js --type minor       # Increment minor version
  node tools/version-bump.js --type major       # Increment major version
  node tools/version-bump.js --set 2.0.0        # Set specific version

Available via npm scripts:
  pnpm run version:bump                         # Increment patch
  pnpm run version:bump:minor                   # Increment minor
  pnpm run version:bump:major                   # Increment major
  pnpm run version:set -- 2.0.0                # Set specific version
`);
}

function parseArgs(args) {
    const options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
            case '-h':
                options.help = true;
                break;
            case '--type':
            case '-t':
                if (i + 1 < args.length) {
                    const type = args[i + 1];
                    if (['major', 'minor', 'patch'].includes(type)) {
                        options.type = type;
                        i++; // Skip next argument
                    } else {
                        throw new Error(`Invalid type: ${type}. Must be major, minor, or patch.`);
                    }
                } else {
                    throw new Error('--type requires a value (major, minor, patch)');
                }
                break;
            case '--set':
            case '-s':
                if (i + 1 < args.length) {
                    options.setVersion = args[i + 1];
                    i++; // Skip next argument
                } else {
                    throw new Error('--set requires a version value (X.Y.Z)');
                }
                break;
            default:
                if (/^\d+\.\d+\.\d+$/.test(arg)) {
                    options.setVersion = arg;
                } else if (!arg.startsWith('-')) {
                    if (['major', 'minor', 'patch'].includes(arg)) {
                        options.type = arg;
                    }
                }
                break;
        }
    }

    return options;
}

function main() {
    const args = process.argv.slice(2);
    let options = {};

    try {
        options = parseArgs(args);

        if (options.help) {
            showHelp();
            return;
        }

        if (options.setVersion && options.type)
            throw new Error('Cannot use both --set and --type options simultaneously.');

        const action = options.setVersion ?
            `Setting version to ${options.setVersion}` :
            `Incrementing ${options.type || 'patch'} version`;

        console.log(`🚀 Starting version bump... (${action})\n`);

        const rootDir = process.cwd();
        const rootPackageJson = path.join(rootDir, 'package.json');

        let updatedCount = 0;

        console.log('📦 Updating root package version...');
        if (updatePackageVersion(rootPackageJson, options)) {
            updatedCount++;
        }

        console.log('\n📚 Updating packages versions...');
        const packagesDir = path.join(rootDir, 'packages');
        const packageFiles = findPackageJsonFiles(packagesDir);

        for (const packageFile of packageFiles) {
            if (updatePackageVersion(packageFile, options)) {
                updatedCount++;
            }
        }

        console.log('\n🚀 Updating apps versions...');
        const appsDir = path.join(rootDir, 'apps');
        const appFiles = findPackageJsonFiles(appsDir);

        for (const appFile of appFiles) {
            if (updatePackageVersion(appFile, options)) {
                updatedCount++;
            }
        }

        console.log(`\n✅ Version bump completed! Updated ${updatedCount} package(s).`);

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        console.log('\nUse --help for usage information.');
        process.exit(1);
    }
}

if (require.main === module)
    main();

module.exports = {
    incrementVersion,
    setVersion,
    updatePackageVersion,
    findPackageJsonFiles,
    showHelp,
    parseArgs
};
