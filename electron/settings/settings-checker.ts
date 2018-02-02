import { Logger } from '../core/logger/logger-electron';
import { SettingsDefault } from './settings-default';
import { SettingsInterface } from './settings.interface';
import * as address from 'address';

const settings = require('electron-settings');

export function checkSettings() {

    Logger.info("[SETTING] Checking settings integrity..");

    let sett: SettingsInterface = settings.getAll();
    
    if (sett.option === undefined) {
        return false;
    }

    function checkRecursive(settings: any, defaultSettings: any, depth: number) {
        let pass = true;
        for (let id in defaultSettings) {
            if (Array.isArray(defaultSettings[id])) {
                if (!Array.isArray(settings[id]) || typeof settings[id] !== 'object') {
                    Logger.info('Error with setting ' + '.'.repeat(depth) + id);
                    Logger.info('-> Current value:  ' + ' '.repeat(depth) + settings[id]);
                    settings[id] = defaultSettings[id];
                    pass = false;
                }
            }
            else {
                if (typeof defaultSettings[id] !== typeof settings[id] && defaultSettings[id] !== null) {
                    Logger.info('Error with setting ' + '.'.repeat(depth) + id);
                    Logger.info('-> Current value:  ' + ' '.repeat(depth) + settings[id]);
                    settings[id] = defaultSettings[id];
                    pass = false;
                }
            }
            if (typeof defaultSettings[id] === 'object') {
                if (!checkRecursive(settings[id], defaultSettings[id], depth + 1)) {
                    Logger.info('Error in           ' + '.'.repeat(depth) + id);
                    pass = false;
                }
            }
        }
        return pass;
    }
    let ok = checkRecursive(sett, SettingsDefault, 0);
    if (!ok) {
        Logger.info('Replacing settings above by defaults');
        settings.setAll(sett);
        ok = checkRecursive(sett, SettingsDefault, 0);
    }


    sett.alertCounter = Math.floor(sett.alertCounter);

    if (!sett.option.general.resolution.x || !sett.option.general.resolution.y) {
        ok = false;
    } else {
        sett.option.general.resolution.x = Math.floor(sett.option.general.resolution.x);
        sett.option.general.resolution.y = Math.floor(sett.option.general.resolution.y);
    }

    if (!settings.get('macAddress')) {
        address.mac((err, addr) => {
            settings.set('macAddress', Buffer.from(addr).toString('base64'));
        });
    }

    (ok) ? Logger.info("[SETTING] Settings are correct.") : Logger.error("[SETTING] Problem detected in settings.");

    return ok;
}
