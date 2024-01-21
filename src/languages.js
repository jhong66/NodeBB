'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const { paths } = require('./constants');
const plugins = require('./plugins');
const Languages = module.exports;
const languagesPath = path.join(__dirname, '../build/public/language');
const files = fs.readdirSync(path.join(paths.nodeModules, '/timeago/locales'));
Languages.timeagoCodes = files.filter(f => f.startsWith('jquery.timeago')).map(f => f.split('.')[2]);
Languages.get = function (language, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        const pathToLanguageFile = path.join(languagesPath, language, `${namespace}.json`);
        if (!pathToLanguageFile.startsWith(languagesPath)) {
            throw new Error('[[error:invalid-path]]');
        }
        const data = yield fs.promises.readFile(pathToLanguageFile, 'utf8');
        const parsed = JSON.parse(data) || {};
        const result = yield plugins.hooks.fire('filter:languages.get', {
            language,
            namespace,
            data: parsed,
        });
        return result.data;
    });
};
let codeCache = null;
Languages.listCodes = function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (codeCache && codeCache.length) {
            return codeCache;
        }
        try {
            const file = yield fs.promises.readFile(path.join(languagesPath, 'metadata.json'), 'utf8');
            const parsed = JSON.parse(file);
            codeCache = parsed.languages;
            return parsed.languages;
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return [];
            }
            throw err;
        }
    });
};
let listCache = null;
Languages.list = function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (listCache && listCache.length) {
            return listCache;
        }
        const codes = yield Languages.listCodes();
        let languages = yield Promise.all(codes.map((folder) => __awaiter(this, void 0, void 0, function* () {
            try {
                const configPath = path.join(languagesPath, folder, 'language.json');
                const file = yield fs.promises.readFile(configPath, 'utf8');
                const lang = JSON.parse(file);
                return lang;
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    return;
                }
                throw err;
            }
        })));
        // filter out invalid ones
        languages = languages.filter(lang => lang && lang.code && lang.name && lang.dir);
        listCache = languages;
        return languages;
    });
};
Languages.userTimeagoCode = function (userLang) {
    return __awaiter(this, void 0, void 0, function* () {
        const languageCodes = yield Languages.listCodes();
        const timeagoCode = utils.userLangToTimeagoCode(userLang);
        if (languageCodes.includes(userLang) && Languages.timeagoCodes.includes(timeagoCode)) {
            return timeagoCode;
        }
        return '';
    });
};
require('./promisify')(Languages);
