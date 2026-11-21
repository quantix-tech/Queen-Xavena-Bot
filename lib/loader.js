import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else if (file.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

export async function loadPlugins() {
    if (!fs.existsSync(PLUGINS_DIR)) {
        console.warn('[loader] plugins/ folder not found');
        return { map: new Map(), list: [] };
    }

    const files = getFiles(PLUGINS_DIR);
    const map  = new Map();
    const list = [];

    for (const fullPath of files) {
        const file = path.basename(fullPath);
        try {
            const mod = await import(pathToFileURL(fullPath).href);
            const plugin = mod.default;

            if (!plugin || !plugin.command || !plugin.execute) {
                continue;
            }

            const cmd = plugin.command.toLowerCase();
            if (map.has(cmd)) continue;

            const finalPlugin = {
                category: 'General',
                ownerOnly: false,
                description: '',
                usage: '',
                aliases: [],
                ...plugin
            };

            // Register main command
            map.set(cmd, finalPlugin);

            // Register aliases
            if (Array.isArray(finalPlugin.aliases)) {
                for (const alias of finalPlugin.aliases) {
                    const aliasLower = alias.toLowerCase();
                    if (!map.has(aliasLower)) {
                        map.set(aliasLower, finalPlugin);
                    }
                }
            }

            list.push(finalPlugin);
        } catch (err) {
            console.error(`[loader] failed to load ${file}:`, err?.message || err);
        }
    }

    console.log(`[loader] loaded ${map.size} plugin(s)`);
    return { map, list };
}

export function getGroupedPlugins(pluginMap) {
    const groups = new Map();
    const uniquePlugins = new Set(pluginMap.values());

    for (const plugin of uniquePlugins) {
        const cat = (plugin.category || 'General').toUpperCase();
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(plugin);
    }
    return groups;
}