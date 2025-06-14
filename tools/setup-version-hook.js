#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setupVersionHook() {
    console.log('🔧 Setting up version bump Git hook...\n');

    const rootDir = process.cwd();
    const huskyDir = path.join(rootDir, '.husky');
    const preCommitHookPath = path.join(huskyDir, 'pre-commit');

    if (!fs.existsSync(huskyDir)) {
        console.error('❌ Husky directory not found. Please run "pnpm prepare" first.');
        process.exit(1);
    }

    const hookContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Executar version bump antes do commit
echo "🚀 Running version bump..."
node tools/version-bump.js

# Adicionar arquivos package.json modificados ao commit
git add package.json packages/*/package.json apps/*/package.json

# Continuar com outros hooks se existirem
echo "✅ Version bump completed and files staged"
`;

    try {
        if (fs.existsSync(preCommitHookPath)) {
            console.log('📝 Updating existing pre-commit hook...');
            const existingContent = fs.readFileSync(preCommitHookPath, 'utf8');

            if (existingContent.includes('tools/version-bump.js')) {
                console.log('✅ Version bump hook already configured!');
                return;
            }

            const lines = existingContent.split('\n');
            const huskyLineIndex = lines.findIndex(line => line.includes('husky.sh'));

            if (huskyLineIndex !== -1) {
                const newLines = [
                    ...lines.slice(0, huskyLineIndex + 1),
                    '',
                    '# Executar version bump antes do commit',
                    'echo "🚀 Running version bump..."',
                    'node tools/version-bump.js',
                    '',
                    '# Adicionar arquivos package.json modificados ao commit',
                    'git add package.json packages/*/package.json apps/*/package.json',
                    '',
                    '# Continuar com outros hooks se existirem',
                    'echo "✅ Version bump completed and files staged"',
                    '',
                    ...lines.slice(huskyLineIndex + 1)
                ];

                fs.writeFileSync(preCommitHookPath, newLines.join('\n'));
            } else {
                fs.writeFileSync(preCommitHookPath, hookContent);
            }
        } else {
            console.log('📝 Creating new pre-commit hook...');
            fs.writeFileSync(preCommitHookPath, hookContent);
        }

        execSync(`chmod +x "${preCommitHookPath}"`);

        console.log('✅ Git hook configured successfully!');
        console.log('📋 The version bump will now run automatically before every commit.');
        console.log('🔧 Hook location:', path.relative(rootDir, preCommitHookPath));

    } catch (error) {
        console.error('❌ Error setting up Git hook:', error.message);
        process.exit(1);
    }
}

function removeVersionHook() {
    console.log('🧹 Removing version bump from Git hook...\n');

    const rootDir = process.cwd();
    const preCommitHookPath = path.join(rootDir, '.husky', 'pre-commit');

    if (!fs.existsSync(preCommitHookPath)) {
        console.log('ℹ️  No pre-commit hook found.');
        return;
    }

    try {
        const content = fs.readFileSync(preCommitHookPath, 'utf8');
        const lines = content.split('\n');

        const filteredLines = lines.filter(line =>
            !line.includes('tools/version-bump.js') &&
            !line.includes('Running version bump') &&
            !line.includes('Version bump completed') &&
            !line.includes('git add package.json packages')
        );

        const cleanedLines = filteredLines.filter((line, index) => {
            const nextLine = filteredLines[index + 1];
            return !(line.includes('Executar version bump') ||
                    line.includes('Adicionar arquivos package.json') ||
                    line.includes('Continuar com outros hooks'));
        });

        if (cleanedLines.length !== lines.length) {
            fs.writeFileSync(preCommitHookPath, cleanedLines.join('\n'));
            console.log('✅ Version bump removed from Git hook.');
        } else {
            console.log('ℹ️  Version bump not found in Git hook.');
        }

    } catch (error) {
        console.error('❌ Error removing version bump from Git hook:', error.message);
    }
}

function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'remove':
        case 'uninstall':
            removeVersionHook();
            break;
        case 'install':
        case 'setup':
        default:
            setupVersionHook();
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = { setupVersionHook, removeVersionHook };
