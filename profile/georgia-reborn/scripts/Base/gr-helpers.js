/////////////////////////////////////////////////////////////////////////////////
// * Georgia-ReBORN: A Clean - Full Dynamic Color Reborn - Foobar2000 Player * //
// * Description:    Georgia-ReBORN Main Helpers                             * //
// * Author:         TT                                                      * //
// * Org. Author:    Mordred                                                 * //
// * Website:        https://github.com/TT-ReBORN/Georgia-ReBORN             * //
// * Version:        3.0-DEV                                                 * //
// * Dev. started:   22-12-2017                                              * //
// * Last change:    19-04-2024                                              * //
/////////////////////////////////////////////////////////////////////////////////


'use strict';


///////////////////////
// * COMPATIBILITY * //
///////////////////////
/**
 * Detects if Internet Explorer is installed on the user's system by searching for specific file paths
 * in the Program Files directories of all available disk drives. Needed to render HTML popups.
 * @global
 * @returns {boolean} True or false.
 */
function DetectIE() {
	const diskLetters = Array.from(Array(26)).map((e, i) => i + 65).map((x) => `${String.fromCharCode(x)}:\\`);
	const paths = ['Program Files\\Internet Explorer\\ieinstal.exe', 'Program Files (x86)\\Internet Explorer\\ieinstal.exe'];
	return diskLetters.some((d) => {
		try { // Needed when permission error occurs and current SMP implementation is broken for some devices....
			return IsFolder(d) ? paths.some((p) => IsFile(d + p)) : false;
		} catch (e) { return false; }
	});
}


/**
 * Detects if the user's system is running on Win x64 by looking for specific folders
 * in the Program Files (x86) directory on all available disk drives. Actually used only for x86 detection.
 * @global
 * @returns {boolean} True or false.
 */
function DetectWin64() {
	const diskLetters = Array.from(Array(26)).map((e, i) => i + 65).map((x) => `${String.fromCharCode(x)}:\\`);
	const paths = ['Program Files (x86)'];
	return diskLetters.some((d) => {
		try { // Needed when permission error occurs and current SMP implementation is broken for some devices....
			return IsFolder(d) ? paths.some((p) => IsFolder(d + p)) : false;
		} catch (e) { return false; }
	});
}


/**
 * Detects if the user's system is running Wine on Linux or MacOs by looking for specific folder
 * with the name 'bin' and files with the names 'bash', 'ls', 'sh', and 'fstab' on any partitions from A to Z.
 * Default Wine mount point is Z:\.
 * @global
 * @returns {boolean} True or false.
 */
function DetectWine() {
	const diskLetters = Array.from(Array(26)).map((e, i) => i + 65).map((x) => `${String.fromCharCode(x)}:\\`);
	const paths = ['bin\\bash', 'bin\\ls', 'bin\\sh', 'etc\\fstab'];
	return diskLetters.some((d) => {
		try { // Needed when permission error occurs and current SMP implementation is broken for some devices....
			return IsFolder(d) ? paths.some((p) => IsFile(d + p)) : false;
		} catch (e) { return false; }
	});
}


/////////////
// * WEB * //
/////////////
/**
 * Compares two versions to determine if a version has changed.
 * Release must be in form of 2.0.0-beta1, or 2.0.1.
 * @global
 * @param {number|string} oldVer - The old version of the config file.
 * @param {number|string} newVer - The new version of the config file.
 * @returns {boolean} True if the `newVer` is newer.
 */
function IsNewerVersion(oldVer, newVer) {
	const a = newVer.split('-');
	const b = oldVer.split('-');
	const pa = a[0].split('.');
	const pb = b[0].split('.');

	for (let i = 0; i < 3; i++) {
		const na = Number(pa[i]);
		const nb = Number(pb[i]);
		if (na > nb) return true;
		if (nb > na) return false;
		if (!isNaN(na) && isNaN(nb)) return true;
		if (isNaN(na) && !isNaN(nb)) return false;
	}

	if (a[1] && b[1]) {
		return a[1] > b[1];
	}

	return !!(!a[1] && b[1]);
}


/**
 * Makes an HTTP request to a URL and calls a callback when the response is received.
 * @global
 * @param {string} type - The type of request to make. Can be one of 'GET' 'POST' 'PUT' 'DELETE'.
 * @param {string} url - The URL to make the request.
 * @param {Function} successCB - The callback function to call when the request is successful.
 * @returns {void}
 */
function MakeHttpRequest(type, url, successCB) {
	const xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
	xmlhttp.open(type, url, true);
	xmlhttp.setRequestHeader('User-Agent', 'foo_spider_monkey_georgia');
	xmlhttp.onreadystatechange = () => {
		if (xmlhttp.readyState === 4) {
			successCB(xmlhttp.responseText);
		}
	}
	try {
		xmlhttp.send();
	} catch (e) {
		console.log('The HTTP request failed:', e);
	}
}


///////////////
// * DEBUG * //
///////////////
/**
 * Asserts that a condition is true and throws an error if it is not.
 * @global
 * @param {boolean} predicate - The condition to evaluate.
 * @param {new (...args: any[]) => Error} ExceptionType - The error constructor to instantiate if the condition is false.
 * @param {...any} args - Additional arguments to pass to the error constructor.
 * @returns {void}
 * @throws {Error} Throws an error of the type specified by `ExceptionType` if `predicate` is false.
 */
function Assert(predicate, ExceptionType, ...args) {
	if (!predicate) throw new ExceptionType(...args);
}


/**
 * Prints exclusive theme debug logs and avoids cluttering the console constantly.
 * @type {function(...*):void} var_args
 * @global
 * @returns {void}
 */
function DebugLog() {
	if (arguments.length && grCfg.settings.showDebugLog) console.log(...arguments);
}


/**
 * Prints a color object to the console.
 * This is primarily for debugging and for the benefit of other tools that rely on color objects.
 * @global
 * @param {object} obj - The object to print.
 * @returns {void}
 */
function PrintColorObj(obj) {
	console.log('\tname: \'\',\n\tcolors: {');
	for (const propName in obj) {
		const propValue = obj[propName];

		console.log(`\t\t${propName}: ${ColToRgb(propValue, true)},\t\t// #${ToPaddedHexString(0xffffff & propValue, 6)}`);
	}
	console.log(`\t},\n\thint: [${ColToRgb(obj.primary, true)}]`);
}


/////////////////
// * PARSING * //
/////////////////
/**
 * Gets the meta values of a specified metadata field from a given metadb object.
 * Will strip leading and trailing %'s from name.
 * @global
 * @param {string} name - The name of the meta field.
 * @param {FbMetadbHandle} metadb - The handle to evaluate string with.
 * @returns {Array<string>} An array of values of the meta field.
 */
function GetMetaValues(name, metadb = undefined) {
	const vals = [];
	const searchName = name.replace(/%/g, '');
	for (let i = 0; i < parseInt($(`$meta_num(${searchName})`, metadb)); i++) {
		vals.push($(`$meta(${searchName},${i})`, metadb));
	}
	if (!vals.length) {
		// This is a fallback in case the `name` property is a complex tf field and meta_num evaluates to 0.
		// In that case we want to evaluate the entire field, after wrapping in brackets and split on commas.
		const unsplit = $(`[${name}]`, metadb);
		if (unsplit.length) {
			return unsplit.split(', ');
		}
	}

	return vals;
}


/**
 * Parses a JSON string into a JavaScript object.
 * @global
 * @param {string} value - The string to parse.
 * @returns {*} The parsed value or null if there was an error.
 */
function _JsonParse(value) {
	try {
		return JSON.parse(value);
	} catch (e) {
		return null;
	}
}


/**
 * Parses a JSON file and returns a JavaScript object.
 * @global
 * @param {string} file - The file to parse.
 * @param {number} codePage - The code page of the JSON document.
 * @returns {object} The JSON object parsed from the file.
 */
function _JsonParseFile(file, codePage = 0) {
	return _JsonParse(Open(file, codePage));
}


/**
 * Parses JSON and returns an array of objects. If there is an error, the error is logged to the console.
 * @global
 * @param {string} json - The JSON to parse as JSON.
 * @param {string} label - A label to print before parsing the JSON.
 * @param {boolean} log - Whether to log the parsing or not.
 * @returns {object} The parsed JSON in an array of objects and returns an array of objects.
 */
function ParseJson(json, label, log) {
	let parsed = [];
	try {
		if (log) {
			console.log(label + json);
		}
		parsed = JSON.parse(json);
	}
	catch (e) {
		console.log('>>> ERROR IN parseJson <<<');
		console.log(json);
	}
	return parsed;
}


/**
 * Sanitizes a string to be safe for insertion into a JSON config.
 * Removes double quotes, backslashes, newlines and trailing spaces.
 * @global
 * @param {string} str - The string to sanitize.
 * @returns {string} The sanitized string.
 */
function SanitizeJsonString(str) {
	if (typeof str !== 'string') return '';

	return str
		.replace(/"/g, '')
		.replace(/\\/g, '')
		.replace(/\r?\n|\r/g, ' ')
		.trim();
}


/**
 * Strips comments from a JSON string.
 * Https://github.com/sindresorhus/strip-json-comments/blob/master/index.js.
 * @global
 * @param {string} jsonString - The JSON string to strip comments from.
 * @param {object} options - The options to control how whitespace is stripped.
 * @returns {string} The stripped string. Note that the result may be empty.
 * @throws {TypeError} If `jsonString` is not a string.
 */
function StripJsonComments(jsonString, options = { whitespace: false }) {
	if (typeof jsonString !== 'string') {
		throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``);
	}

	const singleComment = Symbol('singleComment');
	const multiComment = Symbol('multiComment');
	const stripWithoutWhitespace = () => '';
	const stripWithWhitespace = (string, start, end) => string.slice(start, end).replace(/\S/g, ' ');
	const strip = options.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;

	const isEscaped = (jsonString, quotePosition) => {
		let index = quotePosition - 1;
		let backslashCount = 0;

		while (jsonString[index] === '\\') {
			index--;
			backslashCount++;
		}

		return Boolean(backslashCount % 2);
	};

	let insideString;
	let insideComment;
	let offset = 0;
	let result = '';

	for (let i = 0; i < jsonString.length;) {
		const currentCharacter = jsonString[i];
		const nextCharacter = jsonString[i + 1];

		if (!insideComment && currentCharacter === '"') {
			const escaped = isEscaped(jsonString, i);
			if (!escaped) {
				insideString = !insideString;
			}
		}

		if (insideString) {
			i++;
			continue;
		}

		if (!insideComment && currentCharacter + nextCharacter === '//') {
			result += jsonString.slice(offset, i);
			offset = i;
			insideComment = singleComment;
			i += 2;
			continue;
		}
		else if (insideComment === singleComment && (currentCharacter === '\n' || currentCharacter + nextCharacter === '\r\n')) {
			insideComment = false;
			result += strip(jsonString, offset, i);
			offset = i;
			i += (currentCharacter + nextCharacter === '\r\n') ? 2 : 1;
			continue;
		}
		else if (!insideComment && currentCharacter + nextCharacter === '/*') {
			result += jsonString.slice(offset, i);
			offset = i;
			insideComment = multiComment;
			i += 2;
			continue;
		}
		else if (insideComment === multiComment && currentCharacter + nextCharacter === '*/') {
			insideComment = false;
			result += strip(jsonString, offset, i + 2);
			offset = i + 2;
			i += 2;
			continue;
		}
		else {
			i++;
		}
	}

	return result + (insideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset));
}


/////////////////////////
// * FILE MANAGEMENT * //
/////////////////////////
/**
 * Creates a folder if it doesn't exist.
 * @global
 * @param {string} folder - The folder to create.
 * @param {boolean} is_recursive - Whether to create the folder recursively.
 * @returns {boolean} - True if the folder was created or already exists, false on error.
 */
function CreateFolder(folder, is_recursive) {
	if (utils.IsDirectory(folder)) {
		return true;
	}

	// If recursive creation is needed and the parent directory does not exist, create it
	if (is_recursive) {
		const parentPath = fso.GetParentFolderName(folder);
		if (!utils.IsDirectory(parentPath) && !CreateFolder(parentPath, true)) {
			return false;
		}
	}

	try {
		fso.CreateFolder(folder);
		return true;
	} catch (e) {
		return false;
	}
}


/**
 * Creates complete dir tree if needed up to the final folder.
 * @global
 * @param {string} folder - The folder to create.
 * @returns {boolean} True if the folder was created.
 */
function _CreateFolder(folder) {
	if (!folder.length) {
		return false;
	}

	if (!IsFolder(folder)) {
		if (folder.startsWith('.\\')) {
			folder = fb.FoobarPath + folder.replace('.\\', '');
		}

		const subFolders = folder.split('\\').map((_, i, arr) => i ? arr.slice(0, i + 1).reduce((path, name) => `${path}\\${name}`) : arr[0]);
		let created = true;

		for (const path of subFolders) {
			if (!IsFolder(path)) {
				try {
					fso.CreateFolder(path);
				} catch (e) {
					created = false;
					break;
				}
			}
		}

		return created && IsFolder(folder);
	}

	return true;
}


/**
 * Deletes a file from the file system.
 * @global
 * @param {string} file - The file to delete.
 * @param {boolean} force - Whether to force the deletion even if the file doesn't exist.
 * @returns {boolean} True if the file was deleted.
 */
function _DeleteFile(file, force = true) {
	if (IsFile(file)) {
		if (file.startsWith('.\\')) { file = fb.FoobarPath + file.replace('.\\', ''); }
		try {
			fso.DeleteFile(file, force);
		} catch (e) {
			return false;
		}
		return !(IsFile(file));
	}
	return false;
}


/**
 * Deletes a file.
 * @global
 * @param {string} file - The file to delete.
 * @returns {boolean} True if the file was successfully deleted, false otherwise.
 */
function DeleteFile(file) {
	if (utils.IsFile(file)) {
		try {
			fso.DeleteFile(file);
			return true;
		} catch (e) {
			return false;
		}
	}
	return false;
}


/**
 * Deletes a folder from FSO.
 * @global
 * @param {string} folder - The folder to delete.
 * @param {boolean} force - Makes force deletion even if the folder is inaccessible.
 * @returns {boolean} True if the folder was deleted.
 */
function DeleteFolder(folder, force = true) {
	if (IsFolder(folder)) {
		if (folder.startsWith('.\\')) { folder = fb.FoobarPath + folder.replace('.\\', ''); }
		if (folder.endsWith('\\')) { folder = folder.slice(0, -1); }
		try {
			fso.DeleteFolder(folder, force);
		} catch (e) {
			return false;
		}
		return !(IsFolder(folder));
	}
	return false;
}


/**
 * Checks if a file exists.
 * @global
 * @param {string} filename - The filename to check.
 * @returns {boolean} True if the file exists.
 */
function IsFile(filename) {
	try {
		return utils.IsFile(filename);
	} catch (e) {
		return false;
	}
}


/**
 * Checks if a folder exists.
 * @global
 * @param {string} folder - The folder to check.
 * @returns {boolean} True if the folder exists.
 */
function IsFolder(folder) {
	try {
		return utils.IsDirectory(folder);
	} catch (e) {
		return false;
	}
}


/**
 * Opens a file for reading.
 * @global
 * @param {string} file - The file to open.
 * @param {number} codePage - The code page to open the file in.
 * @returns {string} The contents of the file or '' if the file doesn't exist.
 */
function Open(file, codePage = 0) {
	if (IsFile(file)) {
		if (file.startsWith('.\\')) { file = fb.FoobarPath + file.replace('.\\', ''); }
		return TryMethod('ReadTextFile', utils)(file, codePage) || '';  // Bypasses crash on locked files by another process
	} else {
		return '';
	}
}


/**
 * Opens the Windows file explorer.
 * @global
 * @param {string} c - Command "explorer /open" or "explorer /select" with file path.
 * @returns {*} True if Windows file explorer and file path exist.
 */
function OpenExplorer(c) {
	const run = (c, w) => {
		try {
			if (w === undefined) WshShell.Run(c);
			else WshShell.Run(c, w);
			return true;
		} catch (e) {
			return false;
		}
	};
	if (!run(c)) fb.ShowPopupMessage('Unable to open your file explorer');
}


/**
 * Opens a file in VS Code if installed, otherwise in Notepad.
 * @global
 * @param {string} filePath - The path to the file that you want to open.
 * @returns {*} True if the file exists.
 */
function OpenFile(filePath) {
	if (!RunCmd(`Code ${filePath}`, undefined, false)) {
		RunCmd(`notepad.exe ${filePath}`, undefined, true);
	}
}


/**
 * Sanitizes illegal chars in the file path but skips drive.
 * @global
 * @param {string} value - The value to sanitize. Must be a string of space - separated UTF-8 characters.
 * @returns {string} The sanitized path string.
 */
function SanitizePath(value) {
	if (!value || !value.length) return '';
	const disk = (value.match(/^\w:\\/g) || [''])[0];
	return disk + (disk && disk.length ? value.replace(disk, '') : value).replace(/\//g, '\\').replace(/[|–‐—-]/g, '-').replace(/\*/g, 'x').replace(/"/g, '\'\'').replace(/[<>]/g, '_').replace(/[?:]/g, '').replace(/(?! )\s/g, '');
}


/**
 * Saves value to file, if file doesn't exist it will be created.
 * @global
 * @param {string} file - The path to file to save to.
 * @param {string} value - The value to save to file.
 * @param {boolean} bBOM - Whether to write BOM or not.
 * @returns {boolean} True if saved or false with error.
 */
function Save(file, value, bBOM = false) {
	if (file.startsWith('.\\')) { file = fb.FoobarPath + file.replace('.\\', ''); }
	const filePath = utils.SplitFilePath(file)[0];
	if (!IsFolder(filePath)) { _CreateFolder(filePath); }
	if (IsFolder(filePath) && utils.WriteTextFile(file, value, bBOM)) {
		return true;
	}
	console.log(`Error saving to ${file}`);
	return false;
}


/**
 * Saves value to file, if file doesn't exist it will be created.
 * @global
 * @param {string} file - The file to save to.
 * @param {string} value - The value to save to file.
 * @param {boolean} bUTF16 - True if value is UTF-16.
 * @returns {boolean} True if file was saved.
 */
function SaveFSO(file, value, bUTF16) {
	if (file.startsWith('.\\')) { file = fb.FoobarPath + file.replace('.\\', ''); }
	const filePath = utils.SplitFilePath(file)[0];
	if (!IsFolder(filePath)) { _CreateFolder(filePath); }
	if (IsFolder(filePath)) {
		try {
			const fileObj = fso.CreateTextFile(file, true, bUTF16);
			fileObj.Write(value);
			fileObj.Close();
			return true;
		} catch (e) {}
	}
	console.log(`Error saving to ${file}`);
	return false;
}


/////////////////
// * ACTIONS * //
/////////////////
/**
 * Executes a given function with the provided arguments and returns the result or the error if an exception occurs.
 * @global
 * @param {Function} func - The function to execute.
 * @param {...any} args - Allows to pass any number of arguments to the `attempt` function.
 * @returns {any|Error} The result of the function or the error.
 */
function Attempt(func, ...args) {
	try {
		return func(...args);
	} catch (e) {
		return e;
	}
}


/**
 * Delays the execution of a function until a certain amount of time has passed, with an optional leading execution.
 * @global
 * @param {Function} func - The function to be debounced, will be called after the specified delay has passed.
 * @param {number} delay - The amount of time in milliseconds that the function should wait before executing.
 * @param {boolean} [leading] - The debounced function will be invoked immediately with the current arguments and then regular debouncing.
 * @returns {Function} A new function that will execute the provided `func` after a specified `delay` has passed.
 */
function Debounce(func, delay, { leading } = {}) {
	let timerId;

	return (...args) => {
		if (!timerId && leading) {
			func(...args);
		}
		clearTimeout(timerId);

		timerId = setTimeout(() => func(...args), delay);
	};
}


/**
 * Repeats the specified function a specified number of times.
 * @global
 * @param {Function} func - The function to be repeated.
 * @param {number} times - The number of times to repeat the function.
 * @returns {void}
 */
function RepeatFunc(func, times) {
	if (times > 0) {
		func();
		RepeatFunc(func, times - 1);
	}
}


/**
 * Runs a Windows command prompt and returns false if it fails to run.
 * @global
 * @param {string} command - The command for the OS to execute. Typically a webpage, or a path to an executable.
 * @param {boolean} [wait] - Whether to wait for the command to finish.
 * @param {boolean} [show] - Whether to show the command prompt window.
 * @returns {boolean} True if the command was successfully executed.
 */
function RunCmd(command, wait, show) {
	try {
		WshShell.Run(command, show ? 1 : 0, wait || false);
		return true;
	} catch (e) {
		console.log(`RunCmd(): failed to run command ${command}(${e})`);
		return false;
	}
}


/**
 * Creates a function that can only be called once.
 * The result of the first call is cached and returned on subsequent calls.
 * @global
 * @param {Function} fn - A function to be called only once.
 * @returns {Function} A new function that wraps the `fn` function, caching and returning the result of the first invocation.
 */
function Once(fn) {
	let called = false;
	let result;
	return (...args) => {
		if (!called) {
			result = fn(...args);
			called = true;
		}
		return result;
	};
}


/**
 * Limits the execution of a given function to a specified time frame.
 * @global
 * @param {Function} func - The function to be throttled, will be called after the specified time frame has passed since the last invocation.
 * @param {number} timeFrame - The minimum time interval in milliseconds between function calls. It determines how often the `func` function can be called.
 * @returns {Function} A new function that will execute only if the time elapsed since the last execution is greater than or equal to the specified timeFrame.
 */
function Throttle(func, timeFrame) {
	let lastTime = 0;
	return (...args) => {
		const now = new Date();
		if (now - lastTime >= timeFrame) {
			func(...args);
			lastTime = now;
		}
	};
}


/**
 * Limits the execution of a given function to a specified delay, with an optional immediate execution.
 * @global
 * @param {Function} fn - The function to be throttled, it is the function that will be called after the specified delay.
 * @param {number} delay - The time in milliseconds that specifies how long to wait between function invocations.
 * @param {boolean} immediate - Whether the function should be executed immediately or after the delay.
 * @param {object} parent - The parent object to bind the function to.
 * @returns {Function} A throttled version of the original function.
 */
function _Throttle(fn, delay, immediate = false, parent = this) {
	let timerId;
	return (...args) => {
		const boundFunc = fn.bind(parent, ...args);
		if (timerId) {
			return;
		}
		if (immediate && !timerId) {
			boundFunc();
		}
		timerId = setTimeout(() => {
			if (!immediate) {
				boundFunc();
			}
			timerId = null;
		}, delay);
	};
}


/**
 * Creates a function that will try to call the given method on the given object, but will not throw an error if the method does not exist.
 * It's used for methods that don't have a parent to avoid infinite recursion.
 * @global
 * @param {string} fn - The name of the method to call.
 * @param {object} parent - The object on which to call the method.
 * @returns {Function} The function that will try to call the method.
 */
function TryMethod(fn, parent) {
	return (...args) => {
		try {
			return parent[fn](...args);
		} catch (e) { }
	};
}


////////////////
// * COLORS * //
////////////////
/**
 * Converts RGB values to a 32 bit integer.
 * @global
 * @param {number} r - The red channel value in the range of 0-255.
 * @param {number} g - The green channel value in the range of 0-255.
 * @param {number} b - The blue channel value in the range of 0-255.
 * @returns {number} The RGB value as a 32 bit integer.
 */
function RGB(r, g, b) {
	return (0xff000000 | (r << 16) | (g << 8) | (b));
}


/**
 * Converts RGBA values to a 32 bit integer.
 * @global
 * @param {number} r - The red channel value in the range of 0-255.
 * @param {number} g - The green channel value in the range of 0-255.
 * @param {number} b - The blue channel value in the range of 0-255.
 * @param {number} a - The alpha channel value in the range of 0-255.
 * @returns {number} The RGBA value as a 32 bit integer.
 */
function RGBA(r, g, b, a) {
	return ((a << 24) | (r << 16) | (g << 8) | (b));
}


/**
 * Converts RGB to RGBA.
 * @global
 * @param {number} rgb - The RGB triplet to convert.
 * @param {number} a - The alpha value of the color.
 * @returns {number} The RGBA triplet converted to the specified alpha value.
 */
function RGBtoRGBA(rgb, a) {
	return a << 24 | (rgb & 0x00FFFFFF);
}


/**
 * Converts RGBA to RGB.
 * @global
 * @param {number} rgb - The RGB value to convert.
 * @param {number} a - The alpha value to convert.
 * @returns {number} The RGBA value.
 */
function RGBAtoRGB(rgb, a) {
	return (rgb & 0x00FFFFFF) | (a << 24);
}


/**
 * Converts RGB to HEX.
 * @global
 * @param {number} r - The red channel value to convert.
 * @param {number} g - The green channel value to convert.
 * @param {number} b - The blue channel value to convert.
 * @returns {string} The hex representation of the RGB value.
 */
function RGBtoHEX(r, g, b) {
	r = r.toString(16);
	g = g.toString(16);
	b = b.toString(16);
	return (r.length === 1 ? `0${r}` : r) + (g.length === 1 ? `0${g}` : g) + (b.length === 1 ? `0${b}` : b);
}


/**
 * Converts full RGB color value to HEX.
 * @global
 * @param {number} rgb - The RGB value to convert.
 * @returns {string} The HEX value of the RGB value.
 */
function RGBFtoHEX(rgb) {
	let r = rgb >> 16 & 0xff;
	let g = rgb >> 8 & 0xff;
	let b = rgb & 0xff;
	r = r.toString(16);
	g = g.toString(16);
	b = b.toString(16);
	return (r.length === 1 ? `0${r}` : r) + (g.length === 1 ? `0${g}` : g) + (b.length === 1 ? `0${b}` : b);
}


/**
 * Converts RGBA to HEX.
 * @global
 * @param {number} r - The red channel value in the range of 0-255.
 * @param {number} g - The green channel value in the range of 0-255.
 * @param {number} b - The blue channel value in the range of 0-255.
 * @param {number} a - The alpha channel value in the range of 0-255.
 * @returns {string} The RGB triplet as a HEX.
 */
function RGBAtoHEX(r, g, b, a) {
	a = a.toString(16);
	r = r.toString(16);
	g = g.toString(16);
	b = b.toString(16);
	return (a.length === 1 ? `0${a}` : a) + (r.length === 1 ? `0${r}` : r) + (g.length === 1 ? `0${g}` : g) + (b.length === 1 ? `0${b}` : b);
}


/**
 * Converts a hexadecimal string to decimal.
 * @global
 * @param {string} hex - The hexadecimal string to convert.
 * @returns {number} The decimal equivalent.
 */
function HEX(hex) {
	return parseInt(hex, 16);
}


/**
 * Converts a hex string to RGB.
 * @global
 * @param {string} hex - The hex string to convert.
 * @returns {number} The RGB in the hex string.
 */
function HEXtoRGB(hex) {
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	return RGB(r, g, b);
}


/**
 * Converts a hex string to RGBA.
 * @global
 * @param {string} hex - The hex string to convert.
 * @param {number} a - The alpha value of the color.
 * @returns {number} The hex string to RGBA.
 */
function HEXtoRGBA(hex, a) {
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	return RGBA(r, g, b, a);
}


/**
 * Checks if a string is a valid hexadecimal number.
 * @global
 * @param {string} hex - The string to check.
 * @returns {boolean} Whether the string is a valid hexadecimal number.
 */
function IsHEX(hex) {
	return typeof hex === 'string' && hex.length === 6 && !isNaN(Number(`0x${hex}`))
}


/**
 * Gets the alpha value of a color.
 * @global
 * @param {number} color - The RGB color value with or without alpha channel.
 * @returns {number} The alpha value of the color.
 */
function GetAlpha(color) {
	return ((color >> 24) & 0xff);
}


/**
 * Returns a blended color based on blend factor.
 * @global
 * @param {number} c1 - The color to blend with c2.
 * @param {number} c2 - The color to blend with c1.
 * @param {number} f - The blend factor from 0-1.
 * @returns {number} The blended color as RGBA.
 */
function GetBlend(c1, c2, f) {
	const nf = 1 - f;
	c1 = ToRGBA(c1);
	c2 = ToRGBA(c2);
	const r = c1[0] * f + c2[0] * nf;
	const g = c1[1] * f + c2[1] * nf;
	const b = c1[2] * f + c2[2] * nf;
	const a = c1[3] * f + c2[3] * nf;
	return RGBA(Math.round(r), Math.round(g), Math.round(b), Math.round(a));
}


/**
 * Returns the red value of a color.
 * @global
 * @param {number} color - The color value to convert, must be in the range of 0-255.
 * @returns {number} The red value of a color.
 */
function GetRed(color) {
	return ((color >> 16) & 0xff);
}


/**
 * Returns the green value of a color.
 * @global
 * @param {number} color - The color value to convert, must be in the range of 0-255.
 * @returns {number} The green value of a color.
 */
function GetGreen(color) {
	return ((color >> 8) & 0xff);
}


/**
 * Returns the blue value of a color.
 * @global
 * @param {number} color - The color value to convert, must be in the range of 0-255.
 * @returns {number} The blue value of a color.
 */
function GetBlue(color) {
	return (color & 0xff);
}


/**
 * Converts a color value to RGB.
 * @global
 * @param {number} c - The color value to convert.
 * @returns {Array} The RGB value of the color.
 */
function ToRGB(c) {
	return [c >> 16 & 0xff, c >> 8 & 0xff, c & 0xff];
}


/**
 * Converts a color value to RGBA.
 * @global
 * @param {number} c - The color value to convert.
 * @returns {Array} The RGBA value of the color.
 */
function ToRGBA(c) {
	return [c >> 16 & 0xff, c >> 8 & 0xff, c & 0xff, c >> 24 & 0xff];
}


/**
 * Calculates the brightness of a color.
 * @global
 * @param {number} c - The color to calculate the brightness of, must be in the range of 0-255.
 * @returns {number} The brightness of the color in the range of 0-255.
 */
function CalcBrightness(c) {
	const r = GetRed(c);
	const g = GetGreen(c);
	const b = GetBlue(c);
	return Math.round(Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b));
}


/**
 * Calculates the average brightness of an image.
 * @global
 * @param {GdiBitmap} image - The image to calculate brightness for.
 * @returns {number} The average brightness of the image.
 */
function CalcImgBrightness(image) {
	try {
		const colorSchemeArray = JSON.parse(image.GetColourSchemeJSON(15));
		let rTot = 0;
		let gTot = 0;
		let bTot = 0;
		let freqTot = 0;

		for (const v of colorSchemeArray) {
			const col = ToRGB(v.col);
			rTot += col[0] ** 2 * v.freq;
			gTot += col[1] ** 2 * v.freq;
			bTot += col[2] ** 2 * v.freq;
			freqTot += v.freq;
		}

		const avgCol =
			Math.round([
			Clamp(Math.round(Math.sqrt(rTot / freqTot)), 0, 255) +
			Clamp(Math.round(Math.sqrt(gTot / freqTot)), 0, 255) +
			Clamp(Math.round(Math.sqrt(bTot / freqTot)), 0, 255)
			] / 3);

		if (grCfg.settings.showDebugThemeLog) console.log('Image brightness:', avgCol);
		return avgCol;
	}
	catch (e) {
		console.log('\n>>> Error => CalcImgBrightness failed!\n');
		return 0;
	}
}


/**
 * Calculates the color distance between two colors.
 * Currently uses the redmean calculation from https://en.wikipedia.org/wiki/Color_difference.
 * The purpose of this method is mostly to determine whether a color drawn next to another color will
 * provide enough visual separation. As such, adding some additional weighting based on individual colors differences.
 * @global
 * @param {number} a - The first color in numeric form (i.e. RGB(150,250,255)).
 * @param {number} b - The second color in numeric form (i.e. RGB(150,250,255)).
 * @param {boolean} [log] - Whether to print the distance in the console. Also requires that settings.showDebugThemeLog is true.
 * @returns {number} The color distance as a numeric value.
 */
function ColorDistance(a, b, log) {
	const aCol = new Color(a);
	const bCol = new Color(b);

	const rho = (aCol.r + bCol.r) / 2;
	const rDiff = aCol.r - bCol.r;
	const gDiff = aCol.g - bCol.g;
	const bDiff = aCol.b - bCol.b;
	const deltaR = rDiff ** 2;
	const deltaG = gDiff ** 2;
	const deltaB = bDiff ** 2;

	// const distance = Math.sqrt(2 * deltaR + 4 * deltaG + 3 * deltaB + (rho * (deltaR - deltaB))/256); // Old version
	let distance = Math.sqrt((2 + rho / 256) * deltaR + 4 * deltaG + (2 + (255 - rho) / 256) * deltaB); // Redmean calculation
	if (rDiff >= 50 || gDiff >= 50 || bDiff >= 50) {
		// Because the colors we are diffing against are usually shades of grey, if one of the colors has a diff of 50 or more,
		// then it's very likely there will be enough visual separation between the two, so bump up the diff percentage.
		distance *= 1.1;
	}
	if (log && grCfg.settings.showDebugThemeLog) {
		console.log('Distance from:', aCol.getRGB(), 'to:', bCol.getRGB(), '=', distance);
	}
	return distance;
}


/**
 * Converts a color to RGB. If the alpha is less than 255, it will be converted to RGBA.
 * @global
 * @param {number} c - The color to convert.
 * @param {boolean} showPrefix - Whether to include the "rgb" or "rgba" prefix.
 * @returns {string} The color in RGB format.
 */
function ColToRgb(c, showPrefix) {
	if (typeof showPrefix === 'undefined') showPrefix = true;
	const alpha = GetAlpha(c);
	let prefix = '';
	if (alpha < 255) {
		if (showPrefix) prefix = 'RGBA';
		return `${prefix}(${GetRed(c)}, ${GetGreen(c)}, ${GetBlue(c)}, ${alpha})`;
	} else {
		if (showPrefix) prefix = 'RGB';
		return `${prefix}(${GetRed(c)}, ${GetGreen(c)}, ${GetBlue(c)})`;
	}
}


/**
 * Converts a color string in hexadecimal or RGB format to an RGB integer value.
 * The function supports colors in hexadecimal format (#FFFFFF) and RGB format (rgb(255,255,255)).
 * @global
 * @param {string} colorStr - The color string to convert.
 * @returns {number} The corresponding RGB value as an integer, or 0xff000000 if the string cannot be parsed.
 */
function ColStringToRGB(colorStr) {
	// If the color is in hex format
	if (colorStr.startsWith('#')) {
		return parseInt(colorStr.slice(1), 16);
	}
	// If the color is in rgb format
	const rgb = colorStr.match(/\(\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/);
	if (rgb) return RGB(parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3]));

	return 0xff000000;
}


/**
 * Converts a color object to HSL.
 * @global
 * @param {number} col - The color object with hue, saturation and lightness properties.
 * @returns {string} HSL representation of the color.
 */
function ColorToHSLString(col) {
	return `${LeftPad(col.hue, 3)} ${LeftPad(col.saturation, 3)} ${LeftPad(col.lightness, 3)}`;
}


/**
 * Combines two colors based on a fraction. The fraction should be between 0 and 1.
 * @global
 * @param {number} c1 - The first color to combine. This can be an array of [red, green, blue] values or a color object.
 * @param {number} c2 - The second color to combine. This can be an array of [red, green, blue] values or a color object.
 * @param {number} f - The fraction of the colors to combine. 0 means c1 is the same as c2 100% means c2 is the same as c1.
 * @returns {number} When f is 0, result is 100% color1. When f is 1, result is 100% color2.
 */
function CombineColors(c1, c2, f) {
	c1 = ToRGB(c1);
	c2 = ToRGB(c2);

	const r = Math.round(c1[0] + f * (c2[0] - c1[0]));
	const g = Math.round(c1[1] + f * (c2[1] - c1[1]));
	const b = Math.round(c1[2] + f * (c2[2] - c1[2]));

	return (0xff000000 | (r << 16) | (g << 8) | (b));
}


/**
 * Darkens a color value based on a percentage.
 * @param {number} color - The color to darken.
 * @param {number} percent - The percentage of the color to darken.
 * @returns {number} The darkened color value in the range of 0-255.
 */
function DarkenColorVal(color, percent) {
	const shift = Math.max(color * percent / 100, percent / 2);
	const val = Math.round(color - shift);
	return Math.max(val, 0);
}


/**
 * Lightens a color value based on a percentage.
 * @global
 * @param {number} color - The color to lighten.
 * @param {number} percent - The percentage of the color to lighten.
 * @returns {number} The lightened color value in the range of 0-255.
 */
function LightenColorVal(color, percent) {
	const val = Math.round(color + ((255 - color) * (percent / 100)));
	return Math.min(val, 255);
}


/**
 * Shades a color by a certain percentage.
 * @global
 * @param {number} color - The color to shade.
 * @param {number} percent - The percentage to shade the color by.
 * @returns {number} Returns the shaded color.
 */
function ShadeColor(color, percent) {
	const red = GetRed(color);
	const green = GetGreen(color);
	const blue = GetBlue(color);

	return RGBA(DarkenColorVal(red, percent), DarkenColorVal(green, percent), DarkenColorVal(blue, percent), GetAlpha(color));
}


/**
 * Tints a color by a certain percentage.
 * @global
 * @param {number} color - The color to tint.
 * @param {number} percent - The percentage to tint the color by.
 * @returns {number} Returns the tinted color.
 */
function TintColor(color, percent) {
	const red = GetRed(color);
	const green = GetGreen(color);
	const blue = GetBlue(color);

	return RGBA(LightenColorVal(red, percent), LightenColorVal(green, percent), LightenColorVal(blue, percent), GetAlpha(color));
}


//////////////////
// * GRAPHICS * //
//////////////////
/**
 * A class that represents the position and dimensions of an image.
 * @global
 */
class ImageSize {
	/**
	 * Creates the `ImageSize` instance.
	 * Initializes the size and position of the image.
	 * @param {number} x - The x-coordinate of the image.
	 * @param {number} y - The y-coordinate of the image.
	 * @param {number} w - The width of the image.
	 * @param {number} h - The height of the image.
	 */
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
}


/**
 * A class that encapsulates the creation and management of GDI image and graphics objects.
 * It ensures that only one instance of each object exists within the application at a time (singleton pattern).
 * @example
 * Use GdiService.getInstance() to access the singleton instance of this service throughout the application:
 * const gdiService = GdiService.getInstance();
 * const g = gdiService.getGraphics();
 */
class GdiService {
	/**
	 * Creates the `GdiService` instance.
	 * Initializes a new instance of the GdiService class.
	 */
	constructor() {
		/** @private @type {?GdiBitmap} */
		this.image = null;
		/** @private @type {?GdiGraphics} */
		this.graphics = null;
	}

	/**
	 * Gets the GDI image object, creating it if it doesn't exist.
	 * @returns {GdiBitmap} The GDI image object.
	 */
	getImage() {
		if (!this.image) {
			this.image = gdi.CreateImage(1, 1);
		}
		return this.image;
	}

	/**
	 * Gets the GDI graphics object, creating it if it doesn't exist.
	 * @returns {GdiGraphics} The GDI graphics object.
	 */
	getGraphics() {
		if (!this.graphics) {
			const image = this.getImage();
			this.graphics = image.GetGraphics();
		}
		return this.graphics;
	}

	/**
	 * Releases the graphics object associated with the GDI image.
	 * @param {GdiGraphics} graphics - The GDI graphics object to release.
	 */
	releaseGraphics(graphics) {
		const image = this.getImage();
		image.ReleaseGraphics(graphics);
	}

	/**
	 * Retrieves the singleton instance of the GdiService class, creating it if it doesn't exist.
	 * @returns {GdiService} The singleton instance of the GdiService class.
	 */
	static getInstance() {
		if (!GdiService.instance) {
			GdiService.instance = new GdiService();
		}
		return GdiService.instance;
	}
}


/**
 * Creates a GDI graphics object.
 * @global
 * @param {number} w - The width of the graphics object.
 * @param {number} h - The height of the graphics object.
 * @param {boolean} im - Is the graphics type an image (true) or a text object (false).
 * @param {Function} func - The function to call the graphics object.
 * @returns {GdiGraphics|null} The created or recycled GDI graphics object.
 */
function GDI(w, h, im, func) {
	if (isNaN(w) || isNaN(h)) return null;
	const i = gdi.CreateImage(Math.max(w, 2), Math.max(h, 2));
	let g = i.GetGraphics();
	func(g, i);
	i.ReleaseGraphics(g);
	g = null;
	return im ? i : null;
}


/**
 * Crops an image with optional width and/or height.
 * @global
 * @param {GdiBitmap} image - The image to crop.
 * @param {number} [cropWidth] - The width to crop from the image. If 0, no width cropping is performed.
 * @param {number} [cropHeight] - The height to crop from the image. If 0, no height cropping is performed.
 * @returns {GdiBitmap} The cropped image.
 */
function CropImage(image, cropWidth = 0, cropHeight = 0) {
	const maskWidth = cropWidth ? image.Width - cropWidth : image.Width;
	const maskHeight = cropHeight ? image.Height - cropHeight : image.Height;
	const maskX = cropWidth / 2;
	const maskY = cropHeight / 2;

	// * Mask
	const maskImg = gdi.CreateImage(maskWidth, maskHeight);
	let g = maskImg.GetGraphics();
	g.FillSolidRect(0, 0, maskWidth, maskHeight, 0xff000000);
	maskImg.ReleaseGraphics(g);

	// * Canvas with cropped image
	const croppedImg = gdi.CreateImage(maskWidth, maskHeight);
	g = croppedImg.GetGraphics();
	g.SetSmoothingMode(SmoothingMode.None);
	g.DrawImage(image, 0, 0, maskWidth, maskHeight, cropWidth ? maskX : 0, cropHeight ? maskY : 0, maskWidth, maskHeight);
	croppedImg.ReleaseGraphics(g);
	croppedImg.ApplyMask(maskImg);

	return croppedImg;
}


/**
 * Creates a blended filled round rectangle, a custom method not implemented in SMP.
 * @global
 * @param {GdiGraphics} gr - The GDI graphics object.
 * @param {number} x - The x-coordinate of the rectangle.
 * @param {number} y - The y-coordinate of the rectangle.
 * @param {number} w - The width of the rectangle.
 * @param {number} h - The height of the rectangle.
 * @param {number} arc_width - The width of the arcs.
 * @param {number} arc_height - The height of the arcs.
 * @param {number} [angle] - The angle of the arc in degrees.
 * @param {number} [focus] - The focus where the centered color will be at its highest intensity. Values 0 or 1.
 * @returns {GdiGraphics} The blended filled round rectangle.
 */
function FillBlendedRoundRect(gr, x, y, w, h, arc_width, arc_height, angle, focus) {
	// * Mask
	const maskImg = gdi.CreateImage(w + SCALE(1), h + SCALE(1));
	let g = maskImg.GetGraphics();
	g.FillSolidRect(0, 0, w, h, 0xffffffff);
	g.SetSmoothingMode(SmoothingMode.AntiAlias);
	g.FillRoundRect(0, 0, w - SCALE(1), h - SCALE(1), arc_width, arc_height, 0xff000000);
	maskImg.ReleaseGraphics(g);

	// * Blended rect
	const gradRectImg = gdi.CreateImage(w + SCALE(1), h + SCALE(1));
	g = gradRectImg.GetGraphics();
	g.DrawImage(grCol.imgBlended, 0, 0, w - SCALE(1), h - SCALE(1), 0, h, grCol.imgBlended.Width, grCol.imgBlended.Height);
	gradRectImg.ReleaseGraphics(g);

	const mask = maskImg.Resize(w + SCALE(1), h + SCALE(1));
	gradRectImg.ApplyMask(mask);

	return gr.DrawImage(gradRectImg, x, y, w - SCALE(1), h - SCALE(1), 0, 0, w, h, 0, 255);
}


/**
 * Creates a gradient filled ellipse, a custom method not implemented in SMP.
 * @global
 * @param {GdiGraphics} gr - The GDI graphics object.
 * @param {number} x - The X-coordinate of the ellipse.
 * @param {number} y - The Y-coordinate of the ellipse.
 * @param {number} w - The width of the ellipse.
 * @param {number} h - The height of the ellipse.
 * @param {number} angle - The angle of the ellipse in degrees.
 * @param {number} color1 - The color of the top side of the ellipse.
 * @param {number} color2 - The color of the bottom side of the ellipse.
 * @param {number} focus - The focus where the centered color will be at its highest intensity. Values 0 or 1.
 * @returns {GdiGraphics} The gradient filled ellipse.
 */
function FillGradEllipse(gr, x, y, w, h, angle, color1, color2, focus) {
	const lw = SCALE(2);
	// * Mask
	const maskImg = gdi.CreateImage(w + SCALE(1), h + SCALE(1));
	let g = maskImg.GetGraphics();
	g.FillSolidRect(0, 0, w, h, 0xffffffff);
	g.SetSmoothingMode(SmoothingMode.AntiAlias);
	g.FillEllipse(Math.floor(lw / 2), Math.floor(lw / 2), w - lw - SCALE(1), h - lw - SCALE(1), 0xff000000);
	maskImg.ReleaseGraphics(g);

	// * Gradient ellipse
	const gradEllipseImg = gdi.CreateImage(w + SCALE(1), h + SCALE(1));
	g = gradEllipseImg.GetGraphics();
	g.FillGradRect(Math.floor(lw / 2), Math.floor(lw / 2), w - lw - SCALE(1), h - lw - SCALE(1), angle, color1, color2, focus);
	gradEllipseImg.ReleaseGraphics(g);

	const mask = maskImg.Resize(w + SCALE(1), h + SCALE(1));
	gradEllipseImg.ApplyMask(mask);

	return gr.DrawImage(gradEllipseImg, x, y, w - SCALE(1), h - SCALE(1), 0, 0, w, h, 0, 255);
}


/**
 * Creates a gradient filled round rectangle, a custom method not implemented in SMP.
 * @global
 * @param {GdiGraphics} gr - The GDI graphics object.
 * @param {number} x - The X-coordinate of the rectangle.
 * @param {number} y - The Y-coordinate of the rectangle.
 * @param {number} w - The width of the rectangle.
 * @param {number} h - The height of the rectangle.
 * @param {number} arc_width - The width of the arcs.
 * @param {number} arc_height - The height of the arcs.
 * @param {number} angle - The angle of the arc in degrees.
 * @param {number} color1 - The color of the top side of the gradient.
 * @param {number} color2 - The color of the bottom side of the gradient.
 * @param {number} focus - The focus where the centered color will be at its highest intensity. Values 0 or 1.
 * @returns {GdiGraphics} The gradient filled round rectangle.
 */
function FillGradRoundRect(gr, x, y, w, h, arc_width, arc_height, angle, color1, color2, focus) {
	// * Mask
	const maskImg = gdi.CreateImage(w + SCALE(1), h + SCALE(1));
	let g = maskImg.GetGraphics();
	g.FillSolidRect(0, 0, w, h, 0xffffffff);
	g.SetSmoothingMode(SmoothingMode.AntiAlias);
	g.FillRoundRect(0, 0, w - SCALE(1), h - SCALE(1), arc_width, arc_height, 0xff000000);
	maskImg.ReleaseGraphics(g);

	// * Gradient rect
	const gradRectImg = gdi.CreateImage(w + SCALE(1), h + SCALE(1));
	g = gradRectImg.GetGraphics();
	g.FillGradRect(0, 0, w - SCALE(1), h - SCALE(1), angle, color1, color2, focus);
	gradRectImg.ReleaseGraphics(g);

	const mask = maskImg.Resize(w + SCALE(1), h + SCALE(1));
	gradRectImg.ApplyMask(mask);

	return gr.DrawImage(gradRectImg, x, y, w - SCALE(1), h - SCALE(1), 0, 0, w, h, 0, 255);
}


/**
 * Creates a rotated image, mostly used for disc art.
 * @global
 * @param {GdiBitmap} img - The source image.
 * @param {number} w - The width of image.
 * @param {number} h - The height of image.
 * @param {number} [degrees] - The degrees are clockwise.
 * @returns {GdiBitmap|null} The rotated image or null if an error occurs.
 */
function RotateImg(img, w, h, degrees) {
	if (!img || !w || !h) return null;

	/**
	 * Because foobar x86 can allocate only 4 gigs memory, we must limit disc art res for 4K when using
	 * high grSet.spinDiscArtImageCount, i.e 90 (4 degrees), 120 (3 degrees), 180 (2 degrees) to prevent crash.
	 * When SMP has x64 support, we could try to increase this limit w (1836px max possible res for 4K).
	 */
	const imgMaxRes = ({ 90: 1400, 120: 1200, 180: 1000 })[grSet.spinDiscArtImageCount] || w;
	w = Math.floor(Math.min(w, imgMaxRes));
	h = Math.floor(Math.min(h, imgMaxRes));

	if (degrees !== 0) {
		const rotatedImg = gdi.CreateImage(w, h);
		const gotGraphics = rotatedImg.GetGraphics();
		gotGraphics.DrawImage(img, 0, 0, w, h, 0, 0, img.Width, img.Height, degrees);
		rotatedImg.ReleaseGraphics(gotGraphics);
		return rotatedImg;
	}

	return img.Clone(0, 0, img.Width, img.Height).Resize(w, h);
}


/**
 * Creates a drop shadow rectangle.
 * @global
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 * @param {number} w - The width.
 * @param {number} h - The height.
 * @param {number} radius - The shadow radius.
 * @param {number} color - The shadow color.
 * @returns {GdiBitmap} The image object with the applied drop shadow.
 */
function ShadowRect(x, y, w, h, radius, color) {
	const shadow = gdi.CreateImage(w + 2 * radius, h + 2 * radius);
	const shimg = shadow.GetGraphics();
	shimg.FillRoundRect(x, y, w, h, 0.5 * radius, 0.5 * radius, color);
	shadow.ReleaseGraphics(shimg);
	shadow.StackBlur(radius);

	return shadow;
}


/////////////////
// * DISPLAY * //
/////////////////
/**
 * Scales the value based on 4K mode or not.
 * @global
 * @param {number} val - The value that needs to be scaled for 4K resolution.
 * @returns {number} The value doubled.
 */
function SCALE(val) {
	return RES._4K ? val * 2 : val;
}


/**
 * NOT USED AT THE MOMENT.
 * Converts a size value from points to pixels using the DPI value.
 * @global
 * @param {number} size - The size in pixels.
 * @returns {number} The size in points.
 */
function Scale(size) {
	/**
	 * Checks and sets the actual display DPI number via reading the Windows registry value.
	 * @type {number} Default display dots per inch setting.
	 */
	const DPI = (() => {
		try {
			return WshShell.RegRead('HKCU\\Control Panel\\Desktop\\WindowMetrics\\AppliedDPI');
		} catch (e) {
			return 96;
		}
	})();
	return Math.round(size * DPI / 72);
}


///////////////
// * FONTS * //
///////////////
/**
 * Given an array of fonts, returns a single font which the given text will fully fit the availableWidth,
 * or the last font in the list (should be the smallest and text will be truncated).
 * @global
 * @param {GdiGraphics} gr - The GDI graphics object.
 * @param {number} availableWidth - The maximum width the text should be.
 * @param {string} text - The text to be measured.
 * @param {Array} fontList - The list of fonts to choose from.
 * @param {number} maxLines - The maximum number of lines the text should be.
 * @returns {GdiFont|null} The font that fits the given width, or null if no font fits.
 */
function ChooseFontForWidth(gr, availableWidth, text, fontList, maxLines = 1) {
	let fontIndex;
	for (let i = 0; i < fontList.length; i++) {
		fontIndex = i;
		const measurements = gr.MeasureString(text, fontList[fontIndex], 0, 0, availableWidth, 0);
		if (measurements.Lines <= maxLines) {
			break;
		}
	}
	return fontIndex !== undefined ? fontList[fontIndex] : null;
}


/**
 * Loads a font as a GDI object.
 * @global
 * @param {string} name - The name of the font to load.
 * @param {number} size - The size of the font in pixels.
 * @param {string} style - The style of the font. See style constants for valid values.
 * @returns {GdiFont} The font or null if there was an error.
 */
function Font(name, size, style) {
	let font;
	try {
		font = gdi.Font(name, Math.round(SCALE(size)), style);
	} catch (e) {
		console.log('\nFailed to load font >>>', name, size, style);
	}
	return font;
}


/**
 * Checks if a font exists and is installed. Prints an error message if the font doesn't exist.
 * @global
 * @param {string} fontName - The name of the font to test.
 * @returns {boolean} True if the font exists and is installed, otherwise error message in the console.
 */
function TestFont(fontName) {
	if (!utils.CheckFont(fontName)) {
		console.log(`\nError: Font "${fontName}" was not found.\nPlease install it from the fonts folder or if you use custom theme fonts, use the correct font name / font family name.`);
		return false;
	}
	return true;
}


//////////////
// * TEXT * //
//////////////
/**
 * Calculates the maximum width of a text grid. It is used to determine the width of the grid's maximal text.
 * @global
 * @param {GdiGraphics} gr - The GDI graphics object.
 * @param {Array} gridArray - The array of grid elements that will be measured.
 * @param {GdiFont} font - The font to use for measuring the text.
 * @returns {number} The maximum width of the text.
 */
function CalcGridMaxTextWidth(gr, gridArray, font) {
	let maxWidth = 0;
	if (gridArray) {
		for (const el of gridArray) {
			const width = Math.ceil(gr.MeasureString(el.label, font, 0, 0, grm.ui.ww, grm.ui.wh).Width) + 1;
			if (width > maxWidth) {
				maxWidth = width;
			}
		}
	}
	return maxWidth;
}


/**
 * Given two different texts, and two different font arrays, draws both lines of text
 * in the maximum number of lines available, using the largest font where all of the text will fit.
 * Where text1 ends and text2 begins will be on the same line if possible, switching fonts in between.
 * @global
 * @param {GdiGraphics} gr - The GDI graphics object.
 * @param {number} availableWidth - The maximum width a line of text can occupy.
 * @param {number} left - The X-coordinate of the text.
 * @param {number} top - The Y-coordinate of the text.
 * @param {number} color - The color of the text.
 * @param {string} text1 - The first text snippet.
 * @param {GdiFont[]} fontList1 - The array of fonts to try to fit text1 within availableWidth and maxLines.
 * @param {string} [text2] - The second text snippet if supplied.
 * @param {GdiFont[]} [fontList2] - The array of fonts to try to fit text2 within availableWidth and maxLines after drawing text1.
 * @param {number} [maxLines] - The max number of lines to attempt to draw text1 & text2 in. If text doesn't fit, ellipses will be added.
 * @returns {number} The height of the drawn text.
 */
function DrawMultipleLines(gr, availableWidth, left, top, color, text1, fontList1, text2, fontList2, maxLines = 2) {
	let textArray;
	let lineHeight;
	let continuation;
	for (let fontIndex = 0; fontIndex < fontList1.length && (fontIndex < fontList2.length); fontIndex++) {
		textArray = [];
		lineHeight = Math.max(gr.CalcTextHeight(text1, fontList1[fontIndex]), (text2 ? gr.CalcTextHeight(text2, fontList2[fontIndex]) : 0));
		continuation = false; // Does font change on same line
		/** @type {any[]} */
		const lineText = gr.EstimateLineWrap(text1, fontList1[fontIndex], availableWidth);
		for (let i = 0; i < lineText.length; i += 2) {
			textArray.push({ text: lineText[i].trim(), x_offset: 0, font: fontList1[fontIndex] });
		}
		if (textArray.length <= maxLines && text2) {
			const lastLineWidth = lineText[lineText.length - 1];
			/** @type {any[]} */
			let secondaryText = gr.EstimateLineWrap(text2, fontList2[fontIndex], availableWidth - lastLineWidth - 5);
			const firstSecondaryLine = secondaryText[0]; // Need to subtract the continuation of the previous line from text2
			const textRemainder = text2.slice(firstSecondaryLine.length).trim();
			if (firstSecondaryLine.trim().length) {
				textArray.push({ text: firstSecondaryLine, x_offset: lastLineWidth + 5, font: fontList2[fontIndex] });
				continuation = true; // Font changes on same line
			}
			secondaryText = gr.EstimateLineWrap(textRemainder, fontList2[fontIndex], availableWidth);
			for (let i = 0; i < secondaryText.length; i += 2) {
				textArray.push({ text: secondaryText[i], x_offset: 0, font: fontList2[fontIndex] });
			}
		}
		if (textArray.length - (continuation ? 1 : 0) <= maxLines) break;
	}
	let yOffset = 0;
	let linesDrawn = 0;
	const cutoff = textArray.length > maxLines + (continuation ? 1 : 0);
	textArray.splice(maxLines + (continuation ? 1 : 0));
	for (let i = 0; i < textArray.length; i++) {
		const line = textArray[i];
		if (line.x_offset) {
			// Continuation line, so move back up for drawing
			yOffset -= lineHeight;
		} else if (line.text.length) {
			linesDrawn++;
		}
		if (i === textArray.length - 1 && cutoff) {
			line.text += ' ABCDEFGHIJKMLNOPQRSTUVWXYZABCDEFGHIJKMLNOPQRSTUVWXYZ';	// Trigger ellipses
		}
		gr.DrawString(line.text, line.font, color, left + line.x_offset, top + yOffset,
			availableWidth - line.x_offset, lineHeight, Stringformat.trim_ellipsis_word);
		yOffset += lineHeight;
	}
	return linesDrawn * lineHeight;
}


/**
 * Enhances the original SMP DrawString method to render fonts correctly when text strings contain special symbols.
 * Should be only used for artist, track, album or other metadata text strings.
 * @global
 * @param {GdiGraphics} gr - The GDI graphics object.
 * @param {string} str - The text string to draw. Can be any string but only UTF-8 is supported.
 * @param {GdiFont} font - The font to use. Can be any font supported by GDI.
 * @param {number} color - The X-position to start measuring.
 * @param {number} x - The X-position of the text.
 * @param {number} y - The y-position of the text.
 * @param {number} w - The width of the text.
 * @param {number} h - The height of the text.
 * @param {number} [flags] - The text string format flags.
 * @returns {GdiGraphics} The drawn text string with replaced Segoe UI Symbol font as fallback when the string contains special symbols.
 */
function DrawString(gr, str, font, color, x, y, w, h, flags) {
	const specialSymbolsRegex = /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2020-\u26FF]|\uD83E[\uDD10-\uDDFF]/;
	return gr.DrawString(str, specialSymbolsRegex.test(str) ? gdi.Font('Segoe UI Symbol', font.Size, font.Style) : font, color, x, y, w, h, flags);
}


/**
 * Measures the size of a string.
 * @global
 * @param {string} text - The text to measure. Can be any string but only UTF-8 is supported.
 * @param {GdiFont} font - The font to use. Can be any font supported by GDI.
 * @param {number} x - The X-position to start measuring.
 * @param {number} y - The Y-position to start measuring.
 * @param {number} width - The width of the text to measure.
 * @param {number} height - The height of the text to measure.
 * @returns {number} The size of the string in pixels.
 */
function MeasureString(text, font, x, y, width, height) {
	const img = gdi.CreateImage(1, 1);
	const g = img.GetGraphics();
	const size = g.MeasureString(text, font, x, y, width, height);
	img.ReleaseGraphics(g);
	return size;
}


/**
 * Writes a fancy header string with a given title, decorated with slashes and asterisks.
 * @global
 * @param {string} title - The title to be included in the header.
 * @returns {string} A string that represents a fancy header:
 * ///////////////.
 * // * TITLE * //
 * ///////////////
 */
function WriteFancyHeader(title) {
	const line = '/'.repeat(title.length + 10);
	return `${line}\n// * ${title.toUpperCase()} * //\n${line}`;
}


/////////////////
// * OBJECTS * //
/////////////////
/**
 * Deep assign function that accepts objects as arguments.
 * The source objects are copied into the target object.
 * @global
 * @param {boolean} options - The parameter has following options:
 * - nonEnum: Copy only non - enumerable properties.
 * - symbols: Copy symbols from source to target.
 * - descriptors: Copy descriptors from source to target.
 * - proto: Do not copy prototype properties.
 * @returns {Function} Deep assign function with specified options.
 */
function DeepAssign(options = { nonEnum: false, symbols: false, descriptors: false, proto: false }) {
	/**
	 * Deep assign objects with options. This function is identical to deepAssign except
	 * that it accepts objects as arguments instead of using Object.assign.
	 * @param {object} target - The object to receive the deep assignment.
	 * @param {object} sources - The objects to deep assign.
	 * @returns {void} Void if all sources are valid Objects.
	 */
	return function deepAssignWithOptions (target, ...sources) {
		for (const source of sources) {
			if (!IsDeepObject(source) || !IsDeepObject(target)) { continue; }
			// Copy source's own properties into target's own properties
			const copyProperty = (property) => {
				const descriptor = Object.getOwnPropertyDescriptor(source, property);
				// default: omit non-enumerable properties
				if (descriptor.enumerable || options.nonEnum) {
					// Copy in-depth first
					if (IsDeepObject(source[property]) && IsDeepObject(target[property])) {
						descriptor.value = DeepAssign(options)(target[property], source[property]);
					}
					// default: omit descriptors
					if (options.descriptors) {
						Object.defineProperty(target, property, descriptor); // Shallow copy descriptor
					} else {
						target[property] = descriptor.value; // Shallow copy value only
					}
				}
			};
			// Copy string-keyed properties
			for (const property of Object.getOwnPropertyNames(source)) {
				copyProperty(property);
			}
			// default: omit symbol-keyed properties
			if (options.symbols) {
				for (const symbol of Object.getOwnPropertySymbols(source)) {
					copyProperty(symbol);
				}
			}
			// default: omit prototype's own properties
			if (options.proto) {
				// Copy source prototype's own properties into target prototype's own properties
				DeepAssign(Object.assign({}, options, { proto:false }))( // Prevent deeper copy of the prototype chain
					Object.getPrototypeOf(target),
					Object.getPrototypeOf(source)
				);
			}
		}
		return target;
	}
}


/**
 * Finds keys in an object that match a predicate and returns the first match.
 * @global
 * @param {object} obj - An object to search for a key in.
 * @param {Function} predicate - A function that is used to determine whether a given value meets a certain condition.
 * @returns {string} The key of the object that matches the predicate. It takes three arguments:
 * - The value of the current property being evaluated.
 * - The key of the current property.
 * - The entire object being iterated over.
 */
function FindKey(obj, predicate = (o) => o) {
	return Object.keys(obj).find((key) => predicate(obj[key], key, obj));
}


/**
 * Checks if an object is a deep object.
 * This is similar to typeOf except that it returns true for objects that are themselves objects.
 * @global
 * @param {object} obj - The object to check, can be anything.
 * @returns {boolean} True if the object is a deep object.
 */
function IsDeepObject(obj) {
	return ToType(obj) === 'Object';
}


/**
 * Checks if it is either an empty object or an empty array.
 * @global
 * @param {object | Array} obj - An object or an array.
 * @returns {boolean} True if the object is empty, false otherwise.
 */
function IsEmpty(obj) {
	return [Object, Array].includes((obj || {}).constructor) && !Object.entries(obj || {}).length;
}


/**
 * Checks if a given value is an instance of the Error class.
 * @global
 * @param {object} err - An error object.
 * @returns {boolean} True if the object is an error, false otherwise.
 */
function IsError(err) {
	return err instanceof Error;
}


/**
 * Checks if a given value is an object.
 * @global
 * @param {*} a - Any value that we want to check if it is an object.
 * @returns {boolean} True if the object is an object, false otherwise.
 */
function IsObject(a) {
	return a instanceof Object;
}


/**
 * Returns the type of the input parameter.
 * @global
 * @param {*} a - Any value that we want to determine the type of.
 * @returns {string} The type of object or array as it was.
 */
function ToType(a) {
	return ({}).toString.call(a).match(/([a-z]+)(:?\])/i)[1];
}


////////////////
// * ARRAYS * //
////////////////
/**
 * Takes two arrays as input and returns a new array containing the elements
 * that are present in the first array but not in the second array.
 * @global
 * @param {Array} arr1 - The first array from which we want to find the difference.
 * @param {Array} arr2 - The second array for comparison.
 * @returns {Array} A new array with the elements of arr1 that are not in arr2.
 */
function Difference(arr1, arr2) {
	return arr1.filter((x) => !arr2.includes(x));
}


/**
 * Checks and compares if two arrays are equal.
 * @global
 * @param {Array} arr1 - The first array to compare.
 * @param {Array} arr2 - The second array to compare. Must be of the same type as the first array.
 * @returns {boolean} True if the arrays are equal, false otherwise.
 */
function Equal(arr1, arr2) {
	if (!IsArray(arr1) || !IsArray(arr2)) return false;
	let i = arr1.length;
	if (i !== arr2.length) return false;
	while (i--) {
		if (arr1[i] !== arr2[i]) return false;
	}
	return true;
}


/**
 * Checks if the passed value is an array.
 * @global
 * @param {Array} arr - The array to check.
 * @returns {boolean} True if the array is an array.
 */
function IsArray(arr) {
	return Array.isArray(arr);
}


/**
 * Returns the last element of the given array.
 * @global
 * @param {Array} arr - The array to get the last element from.
 * @returns {*} The last element of the array.
 */
function Last(arr) {
	return arr[arr.length - 1];
}


/**
 * Creates an array of numbers within a specified range, with an optional increment value.
 * @global
 * @param {number} start - The starting value of the range.
 * @param {number} end - The end value of the range. It specifies the upper limit of the range of numbers that will be generated.
 * @param {number} increment - The value by which each element in the range is incremented.
 * If the `increment` parameter is not provided, it will be set to the sign of the difference between the `end` and `start` values.
 * @returns {Array<number>} An array of numbers that represents a range of values.
 */
function Range(start, end, increment = 1) {
    const result = [];

    for (let i = start; i < end; i += increment) {
        result.push(i);
    }

    return result;
}


/**
 * Removes a specified number of elements from either the beginning or end of an array.
 * @global
 * @param {Array} array - The array parameter is the array that you want to trim.
 * @param {number} count - The number of elements to be removed from the array.
 * @param {boolean} fromHead - Trims from the beginning of the array (if true) or from the end of the array (if false).
 */
function TrimArray(array, count, fromHead) {
	if (fromHead) {
		array.splice(0, count);
	} else {
		array.length -= count;
	}
}


/**
 * Takes an array and any number of additional arrays as arguments,
 * and returns a new array that contains all unique elements from all the arrays.
 * @global
 * @param {Array} arr - The first array.
 * @param {...Array} args - The remaining arrays.
 * @returns {Array} The new array.
 */
function Union(arr, ...args) {
	return [...new Set(arr.concat(...args))];
}


/**
 * Zips the given arrays together into a single array of arrays.
 * @global
 * @param {Array} arr - The first array that will be used as the base for creating a new array.
 * @param {...Array} args - The remaining arrays.
 * @returns {Array} The new array.
 */
function Zip(arr, ...args) {
	const minLength = Math.min(arr.length, ...args.map(a => a.length));
	const result = new Array(minLength);

	for (let i = 0; i < minLength; i++) {
		const group = new Array(1 + args.length);
		group[0] = arr[i];

		for (let j = 0; j < args.length; j++) {
			group[j + 1] = args[j][i];
		}

		result[i] = group;
	}

	return result;
}


/////////////////
// * NUMBERS * //
/////////////////
/**
 * Takes a number and limits it to a specified range.
 * @global
 * @param {number} num - The number to clamp between the minimum and maximum values.
 * @param {number} min - The minimum value that the `num` parameter can be.
 * @param {number} max - The maximum value that the `num` parameter can be.
 * If the `num` parameter is greater than `max`, it will be clamped to `max`.
 * @returns {number} The clamped value of `num`.
 */
function Clamp(num, min, max) {
	num = num <= max ? num : max;
	return num >= min ? num : min;
}


/**
 * Generates a random number between a minimum and maximum value.
 * @global
 * @param {number} min - The minimum value that for the random number.
 * @param {number} max - The maximum value that for the random number.
 * @returns {number} A random number between the minimum and maximum values.
 */
function RandomMinMax(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}


/**
 * Rounds the given float number to the specified number of decimals.
 * @global
 * @param {number} floatnum - The float number to round.
 * @param {number} decimals - The number of decimals to round to. If decimals is less than or equal to 0 the number is rounded to the nearest integer.
 * @param {number} eps - A small number to add to the float number to avoid rounding errors.
 * @returns {number} The rounded number.
 */
function Round(floatnum, decimals, eps = 10 ** -14) {
	let result;
	if (decimals > 0) {
		result = decimals === 15 ? floatnum : Math.round(floatnum * 10 ** decimals + eps) / 10 ** decimals;
	} else {
		result = Math.round(floatnum);
	}
	return result;
}


/**
 * Rounds a number to the specified number of decimal places.
 * @global
 * @param {number} number - The number to round, must be non-negative.
 * @param {number} precision - The number of decimal places to round to.
 * @returns {number} The number rounded to the specified precision.
 */
function ToFixed(number, precision) {
	const factor = 10 ** precision;
	return Math.round(number * factor) / factor;
}


/////////////////
// * STRINGS * //
/////////////////
/**
 * Formats a title and returns the result.
 * @global
 * @param {string} titleFormatString - The title format string to evaluate.
 * @param {FbMetadbHandle} metadb - The handle to evaluate string with.
 * @param {boolean} [force] - An optional force evaluate.
 * @returns {string} The formatted title or an error message.
 */
function $(titleFormatString, metadb = undefined, force = false) {
	try {
		return metadb ? fb.TitleFormat(titleFormatString).EvalWithMetadb(metadb) : fb.TitleFormat(titleFormatString).Eval(force);
	} catch (e) {
		return `${e} (Invalid metadb!)`;
	}
}


/**
 * Escapes special characters in a string for use in title formatting expressions.
 * This includes escaping single quotes, parentheses, square brackets, commas, percent signs, and dollar signs.
 * @global
 * @param {string} string - The string to be escaped.
 * @returns {string} The escaped string, safe for use in title formatting expressions.
 */
function $Escape(string) {
	return string
		.replace(/'/g, "''")
		.replace(/[()[\],%]/g, "'$&'")
		.replace(/\$/g, "'$$$$'");
}


/**
 * Checks if all characters in a string are equal.
 * @global
 * @param {string} str - The string to check.
 * @returns {boolean} True if all characters in the string are equal.
 */
function AllEqual(str) {
	return str.split('').every(char => char === str[0]);
}


/**
 * Capitalizes first letter of a string.
 * @global
 * @param {string} s - The string that will be capitalized.
 * @returns {string} The capitalized string.
 */
function CapitalizeString(s) {
	return s && s[0].toUpperCase() + s.slice(1);
}


/**
 * Converts a full country name to its ISO country code.
 * @global
 * @param {string} name - The full country name.
 * @returns {string} The country ISO code.
 */
function ConvertFullCountryToIso(name) {
	if (Array.isArray(name)) name = name[0];
	if (typeof name !== 'string') return null;

	for (const code in CountryCodes) {
		if (Object.prototype.hasOwnProperty.call(CountryCodes, code) &&
			CountryCodes[code].toLowerCase() === name.toLowerCase()) {
			return code;
		}
	}
	return null;
}


/**
 * Converts an ISO country code to its full name.
 * @global
 * @param {string} code - The two letter ISO country code.
 * @returns {string} The full name of the country.
 */
function ConvertIsoCountryCodeToFull(code) {
	if (code.length === 2) {
		return CountryCodes[code];
	}
	return code;
}


/**
 * Checks if a given value is a string.
 * @global
 * @param {*} str - The value to check if it is a string.
 * @returns {boolean} True if the value is a string, false otherwise.
 */
function IsString(str) {
	return str != null && typeof str.valueOf() === 'string';
}


/**
 * Left pads a string to a specified size.
 * @global
 * @param {string} val - The value to pad. Can be any type but not necessarily a string.
 * @param {number} size - The size to pad to. Must be greater than or equal to the value of val.
 * @param {string} ch - The character to use for padding. If null, a space will be used.
 * @returns {string} The left padded string.
 */
function LeftPad(val, size, ch) {
	let result = String(val);
	if (!ch) {
		ch = ' ';
	}
	while (result.length < size) {
		result = ch + result;
	}
	return result;
}


/**
 * Takes an array of strings as input and returns the string with the longest length.
 * @global
 * @param {Array} arr - The array to compare.
 * @returns {string} The longest string.
 */
function LongestString(arr) {
	return arr.reduce((a, b) => a.length > b.length ? a : b);
}


/**
 * Pads a number with zeros to a given length.
 * @global
 * @param {number} num - The number to be padded. Must be convertible to the specified base.
 * @param {number} len - The length of the number to be padded.
 * @param {number} base - The base to pad the number to. Default is 10.
 * @returns {string} The number with the specified length and padded with zeros to the specified base.
 */
function PadNumber(num, len, base) {
	if (!base) base = 10;
	return (`000000${num.toString(base)}`).slice(-len);
}


/**
 * Wraps a string in double quotes.
 * @global
 * @param {string} value - The value to be quoted.
 * @returns {string} The quoted value.
 */
function Quotes(value) {
	return `"${value}"`;
}


/**
 * Replaces unicode characters such as apostrophes and multi-timestamps which will print as crap.
 * May not be needed when using UTF-8 code page.
 * @global
 * @param {string} rawString - The raw string that has certain characters that need to be replaced.
 * @returns {string} The modified string with replaced characters.
 */
function ReplaceChars(rawString) {
	return rawString.trim()
	.replace(/&amp(;|)/g, '&')
	.replace(/&gt(;|)/g, '>')
	.replace(/&lt(;|)/g, '<')
	.replace(/&nbsp(;|)/g, '')
	.replace(/&quot(;|)/g, '"')
	.replace(/<br>/gi, '')
	.replace(/\uFF1A/g, ':')
	.replace(/\uFF08/g, '(')
	.replace(/\uFF09/g, ')')
	.replace(/\u00E2\u20AC\u2122|\u2019|\uFF07|[\u0060\u00B4]|â€™(;|)|â€˜(;|)|&apos(;|)|&#39(;|)|(&#(?:039|8216|8217|8220|8221|8222|8223|x27);)/g, "'") // Apostrophe variants
	.replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000\uFEFF]/g, ' ') // Whitespace variants
	.replace(/(\s*)<(\d{1,2}:|)\d{1,2}:\d{2}(>|\.\d{1,3}>)(\s*)/g, '$1$4'); // Fix enhanced LRC format
}


/**
 * Replaces special characters in filenames.
 * @global
 * @param {string} s - The string to be replaced.
 * @returns {string} The modified string with replaced characters.
 */
function ReplaceFileChars(s) {
	return s.replace(/:/g, '_')
			.replace(/\\/g, '-')
			.replace(/\//g, '-')
			.replace(/\?/g, '')
			.replace(/</g, '')
			.replace(/>/g, '')
			.replace(/\*/g, '')
			.replace(/"/g, '\'')
			.replace(/\|/g, '-');
}


/**
 * Formats a text string, accepts 1-4 parameters, corresponding to h_align, v_align, trimming, flags.
 * @global
 * @param {number} [h_align] - 0: Near, 1: Center, 2: Far.
 * @param {number} [v_align] - 0: Near, 1: Center, 2: Far.
 * @param {number} [trimming] - 0: None, 1: Char, 2: Word, 3: Ellipses char, 4: Ellipses word, 5: Ellipses path.
 * @param {number} [flags] - `|`'d together flags. See Stringformat in gr-common.js.
 * @returns {number} The string format value.
 */
function StringFormat(h_align, v_align, trimming, flags) {
	if (!h_align) h_align = 0;
	if (!v_align) v_align = 0;
	if (!trimming) trimming = 0;
	if (!flags) flags = 0;

	return ((h_align << 28) | (v_align << 24) | (trimming << 20) | flags);
}


/**
 * Converts a number to a padded hex string.
 * @global
 * @param {number} num - The number to convert.
 * @param {number} len - The length of the padded string.
 * @returns {string} The padded hex string.
 */
function ToPaddedHexString(num, len) {
	return PadNumber(num, len, 16);
}


/////////////////////
// * COMPARISONS * //
/////////////////////
/**
 * Compares two values, providing a safe comparison for strings and numbers.
 * If both values are strings, it uses the localeCompare function and returns -1, 0, or 1.
 * If not, it subtracts b from a (considering undefined or null as 0), and returns the subtraction result, which could be any number.
 * @global
 * @param {string|number} a - The first value to compare.
 * @param {string|number} b - The second value to compare.
 * @returns {number} The result of the comparison.
 * When comparing strings, -1 if a < b, 0 if a = b, 1 if a > b.
 * When comparing numbers, the result of (a - b).
 */
function CompareValues(a, b) {
	return typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : (a || 0) - (b || 0);
}


/**
 * Returns the key from `sumObj` and `countObj` with the highest average value.
 * @global
 * @param {(object | Map)} sumObj - The object or map containing sum values, where each key represents a unique category.
 * @param {(object | Map)} countObj - The object or map containing count values, where each key should match a key in `sumObj`.
 * @returns {(string|undefined)} The key associated with the highest average value.
 * Returns `undefined` if `sumObj` and `countObj` do not have any matching keys, or if any value in `countObj` is zero (to avoid division by zero).
 */
function GetKeyByHighestAvg(sumObj, countObj) {
	let highestAverage = -Infinity;
	let highestKey;
	const keys = sumObj instanceof Map ? sumObj.keys() : Object.keys(sumObj);

	for (const key of keys) {
		if (sumObj instanceof Map ? countObj.has(key) : Object.prototype.hasOwnProperty.call(countObj, key)) {
			const sumValue = sumObj instanceof Map ? sumObj.get(key) : sumObj[key];
			const countValue = sumObj instanceof Map ? countObj.get(key) : countObj[key];
			const average = sumValue / countValue;

			if (average > highestAverage) {
				highestAverage = average;
				highestKey = key;
			}
		}
	}
	return highestKey;
}


/**
 * Returns the first key associated with the highest value in an object or map.
 * @global
 * @param {(object | Map)} obj - The input object or map whose key-value pairs are examined.
 * @returns {(string|null)} The first key associated with the highest value, or null if the object or map is empty.
 */
function GetKeyByHighestVal(obj) {
	const entries = obj instanceof Map ? obj.entries() : Object.entries(obj);
	const highestEntry = [...entries].reduce(([keyA, valA], [keyB, valB]) => valA >= valB ? [keyA, valA] : [keyB, valB], [null, -Infinity]);
	return highestEntry[0];
}


/**
 * Sorts the keys of an object or map in descending order based on the average of their corresponding values in two different objects or Maps.
 * @global
 * @param {(object | Map)} sumObj - The object or map whose keys are to be sorted. The values are summed values for each key.
 * @param {(object | Map)} countObj - The object or map with the same keys as sumObj. The values are the count of occurrences for each key.
 * @returns {Array} An array of keys from `sumObj` and `countObj`, sorted in descending order of their corresponding average values (sum / count).
 */
function SortKeyValuesByAvg(sumObj, countObj) {
	const averages = new Map();
	const keys = sumObj instanceof Map ? sumObj.keys() : Object.keys(sumObj);

	for (const key of keys) {
		const sumValue = sumObj instanceof Map ? sumObj.get(key) : sumObj[key];
		const countValue = sumObj instanceof Map ? countObj.get(key) : countObj[key];
		averages.set(key, sumValue / countValue);
	}

	return [...averages.entries()].sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
}


/**
 * Sorts the keys of an object or map in descending order based on their corresponding values.
 * @global
 * @param {(object | Map)} obj - The object or map whose keys are to be sorted.
 * @returns {Array} An array of keys from `obj`, sorted in descending order of their corresponding values.
 */
function SortKeyValuesByDsc(obj) {
	const entries = obj instanceof Map ? obj.entries() : Object.entries(obj);
	return [...entries].sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
}


//////////////
// * TIME * //
//////////////
/**
 * Calculate the age as the difference between the current time and the given date in seconds.
 * @global
 * @param {Date} date - The date to calculate the age for.
 * @returns {number} The aging of the passed time.
 */
function CalcAge(date) {
	const round = 1000;	// Round to the second
	const now = new Date();
	return Math.floor(now.getTime() / round) - Math.floor(date / round);
}


/**
 * Calculates the age ratio.
 * @global
 * @param {number} num - The number to calculate the age ratio for.
 * @param {number} divisor - The number to divide the age by ( should be between 0 and 1 ).
 * @returns {number} The age ratio in 3 decimal places.
 */
function CalcAgeRatio(num, divisor) {
	return ToFixed(1.0 - (CalcAge(num) / divisor), 3);
}


/**
 * Calculates the difference between the input date and the current date.
 * @global
 * @param {string} date - The date to calculate age for.
 * @returns {string} The age date in format YYYY-MM-DD.
 */
function CalcAgeDateString(date) {
	let str = '';
	const timezoneOffset = UpdateTimezoneOffset();
	if (date.length) {
		try {
			str = DateDiff($Date(date), undefined, timezoneOffset);
		} catch (e) {
			console.log('date has invalid value', date, 'in CalcAgeDateString()');
			// Throw new ArgumentError('date', date, 'in CalcAgeDateString()');
		}
	}
	return str.trim();
}


/**
 * Passes any date string to $Date ('Y - m - d H : i : s').
 * @global
 * @param {string} dateStr - A date string in the format YYYY-MM-DD.
 * @returns {string} The formatted date.
 */
function $Date(dateStr) {
	return $(`$date(${dateStr})`);
}


/**
 * Returns the difference between a start and end date in the form of "1y 12m 31d". Order of the two dates does not matter.
 * @global
 * @param {string} startingDate - The start date in YYYY-MM-DD format.
 * @param {string} endingDate - The end date in YYYY-MM-DD format. If no endingDate is supplied, use current time.
 * @param {number} timezoneOffset - The timezone offset in milliseconds. This offset is subtracted from the current time if no endingDate is supplied.
 * @returns {string} The difference between the two dates in the format YYYY-MM-DD.
 */
function DateDiff(startingDate, endingDate, timezoneOffset) {
	if (!startingDate) return '';
	const hasStartDay = (startingDate.length > 7);
	if (!hasStartDay) {
		startingDate += '-02'; // Avoid timezone issues
	}
	let startDate = new Date(new Date(startingDate).toISOString().slice(0, 10));
	if (!endingDate) {
		const now = new Date().getTime() - timezoneOffset; // Subtract timezone offset because we're stripping timezone from ISOString
		endingDate = new Date(now).toISOString().slice(0, 10); // Need date in YYYY-MM-DD format
	}
	let endDate = new Date(endingDate);
	if (startDate > endDate) {
		const swap = startDate;
		startDate = endDate;
		endDate = swap;
	}
	const startYear = startDate.getFullYear();
	const februaryDays = (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0 ? 29 : 28;
	const daysInMonth = [31, februaryDays, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	let yearDiff = endDate.getFullYear() - startYear;
	let monthDiff = endDate.getMonth() - startDate.getMonth();
	let dayDiff = 0;
	if (monthDiff < 0) {
		yearDiff--;
		monthDiff += 12;
	}
	if (hasStartDay) {
		dayDiff = endDate.getDate() - startDate.getDate();
		if (dayDiff < 0) {
			if (monthDiff > 0) {
				monthDiff--;
			} else {
				yearDiff--;
				monthDiff = 11;
			}
			dayDiff += daysInMonth[startDate.getMonth()];
		}
	}

	return (yearDiff ? `${yearDiff}y ` : '') + (monthDiff > 0 ? `${monthDiff}m ` : '') + (dayDiff ? `${dayDiff}d` : '');
}


/**
 * Converts a date object to a YYYY-MM-DD string.
 * @global
 * @param {string} date - The date to convert. Must be non null and not out of range.
 * @returns {string} The date in YYYY-MM-DD format.
 */
function DateToYMD(date) {
	const d = date.getDate();
	const m = date.getMonth() + 1; // Month from 0 to 11
	const y = date.getFullYear();
	return `${y}-${(m <= 9 ? `0${m}` : m)}-${(d <= 9 ? `0${d}` : d)}`;
}


/**
 * Converts a 24-hour time format hour to 12-hour time format.
 * @global
 * @param {number|string} hour - The hour in 24-hour format.
 * @returns {string} The hour in 12-hour format with AM/PM suffix.
 */
function To12HourTimeFormat(hour) {
	const hourInt = parseInt(hour, 10);
	const suffix = hourInt >= 12 ? 'PM' : 'AM';
	const hour12 = hourInt % 12 === 0 ? 12 : hourInt % 12;
	return `${hour12} ${suffix}`;
}


/**
 * Converts a date string to a date time string.
 * @global
 * @param {string} dateTimeStr - The date string to convert.
 * @returns {string} The date time string.
 */
function ToDatetime(dateTimeStr) {
	return dateTimeStr.replace(' ', 'T');
}


/**
 * The foobar time strings are already in local time, so converting them to date objects treats them as UTC time,
 * and again adjusts to local time, and the timezone offset is applied twice. Therefore we need to add it back in here.
 * @global
 * @param {string} dateTimeStr - The date string to convert.
 * @param {number} timezoneOffset - The timezone offset in milliseconds to add back to the time.
 * @returns {number|undefined} The converted time in milliseconds, or undefined if dateTimeStr is 'N/A'.
 */
function ToTime(dateTimeStr, timezoneOffset) {
	if (dateTimeStr === 'N/A') {
		return undefined;
	}
	return new Date(ToDatetime(dateTimeStr)).getTime() + timezoneOffset;
}


/**
 * Updates the current timezone offset based on DST adjustments. This function can be called, for example, from on_playback_new_track.
 * @global
 * @returns {number} The current timezone offset in milliseconds.
 */
function UpdateTimezoneOffset() {
	const temp = new Date();
	return temp.getTimezoneOffset() * 60 * 1000;
}


////////////////////////
// * THEME SPECIFIC * //
////////////////////////
/**
 * Deletes the Biography cache on auto or manual usage.
 * @global
 */
function DeleteBiographyCache() {
	try { fso.DeleteFolder(grSet.customBiographyDir ? `${grCfg.customBiographyDir}\\*.*` : `${fb.ProfilePath}cache\\biography\\biography-cache`); }
	catch (e) {}
}


/**
 * Deletes the Library cache on auto or manual usage.
 * @global
 */
function DeleteLibraryCache() {
	try { fso.DeleteFolder(grSet.customLibraryDir ? `${grCfg.customLibraryDir}\\*.*` : `${fb.ProfilePath}cache\\library\\library-tree-cache`); }
	catch (e) {}
}


/**
 * Deletes the Lyrics cache on auto or manual usage.
 * @global
 */
function DeleteLyrics() {
	try { fso.DeleteFile(grSet.customLyricsDir ? `${grCfg.customLyricsDir}\\*.*` : `${fb.ProfilePath}cache\\lyrics\\*.*`); }
	catch (e) {}
}


/**
 * Deletes the Waveform bar cache on auto or manual usage.
 * @global
 */
function DeleteWaveformBarCache() {
	try { fso.DeleteFolder(grSet.customWaveformBarDir ? `${grCfg.customWaveformBarDir}\\*.*` : `${fb.ProfilePath}cache\\waveform\\*.*`); }
	catch (e) {}
}


/**
 * Formats the theme day/night mode time range string into a more readable format.
 * @global
 * @param {string|null} themeDayNightMode - The time range for theme day/night mode in 24-hour format, e.g. '6-18' for 6am to 6pm. If null or undefined, it returns 'Deactivated (default)'.
 * @returns {string} A formatted string representing the time range in 12-hour format with am/pm suffixes, e.g. '06am (day) - 06pm (night)', or 'Deactivated (default)' if themeDayNightMode is falsy.
 */
function FormatThemeDayNightModeString(themeDayNightMode) {
	if (!themeDayNightMode) return 'Deactivated (default)';

	// * Safeguard to handle number values and convert them to string with default end hour
	if (typeof grSet.themeDayNightMode === 'number') {
		grSet.themeDayNightMode = `${grSet.themeDayNightMode}-18`; // Defaulting end hour to 18 (6 PM)
	} else if (typeof grSet.themeDayNightMode === 'string' && !grSet.themeDayNightMode.includes('-')) {
		grSet.themeDayNightMode = `${grSet.themeDayNightMode}-${grSet.themeDayNightMode}`; // Same start and end hour
	}

	const [start, end] = themeDayNightMode.split('-').map(part => {
		let hour = parseInt(part, 10);
		const suffix = (hour >= 12 && hour < 24) ? ' PM' : ' AM';
		hour = (hour === 0 || hour === 12) ? 12 : hour % 12;
		return `${hour.toString().padStart(2, '0')}${suffix}`;
	});
	return `${start} (day) - ${end} (night)`;
}


/**
 * Makes or restores a theme backup.
 * @global
 * @param {boolean} make - Should a theme backup be made.
 * @param {boolean} restore - Should a theme backup be restored.
 */
function ManageBackup(make, restore) {
	const backupPath = `${fb.ProfilePath}backup\\profile\\`;
	const cfgPathFb  = `${fb.ProfilePath}configuration`;
	const dspPathFb  = `${fb.ProfilePath}dsp-presets`;
	const cfgPathBp  = `${backupPath}configuration`;
	const dspPathBp  = `${backupPath}dsp-presets`;
	const indexPath  = `${backupPath}index-data`;
	const themePath  = `${backupPath}georgia-reborn`;

	const libOld   = make ? `${fb.ProfilePath}library`        : `${backupPath}library`;
	const libNew   = make ? `${fb.ProfilePath}library-v2.0`   : `${backupPath}library-v2.0`;
	const plistOld = make ? `${fb.ProfilePath}playlists-v1.4` : `${backupPath}playlists-v1.4`;
	const plistNew = make ? `${fb.ProfilePath}playlists-v2.0` : `${backupPath}playlists-v2.0`;

	let libaryDir;
	let playlistDir;
	let oldVersion = false;

	const checkVersion = async () => {
		if      (IsFolder(libOld)) { libaryDir = libOld; oldVersion = true; }
		else if (IsFolder(libNew)) { libaryDir = libNew; oldVersion = false; }
		if      (IsFolder(plistOld)) { playlistDir = plistOld; oldVersion = true; }
		else if (IsFolder(plistNew)) { playlistDir = plistNew; oldVersion = false; }
	};

	const createFolders = async () => {
		CreateFolder(themePath, true);
		CreateFolder(cfgPathFb, true);
		CreateFolder(cfgPathBp, true);
		CreateFolder(dspPathFb, true);
		CreateFolder(dspPathBp, true);
		if (oldVersion) CreateFolder(indexPath, true);
	};

	const checkFolders = () => {
		// * Safeguard to prevent crash when directories do not exist
		const foldersExist =
			((IsFolder(libOld) && IsFolder(plistOld)) || IsFolder(libNew) && IsFolder(plistNew))
			&&
			(IsFolder(themePath) && IsFolder(dspPathFb) && IsFolder(dspPathBp) && IsFolder(cfgPathFb) && IsFolder(cfgPathBp));

		if (foldersExist) {
			return true;
		}
		else {
			if (make) {
				fb.ShowPopupMessage(`>>> Georgia-ReBORN theme backup was aborted <<<\n\n"configuration" or "dsp-presets" or "georgia-reborn" or "library" or "playlist" directory\ndoes not exist in:\n${fb.ProfilePath}`, 'Theme backup');
			} else {
				fb.ShowPopupMessage(`>>> Georgia-ReBORN restore backup was aborted <<<\n\n"backup" directory does not exist in:\n${fb.ProfilePath}\n\nor\n\n"configuration" or "dsp-presets" or "georgia-reborn" or "library" or "playlist" directory\ndoes not exist in:\n${fb.ProfilePath}backup`, 'Theme backup');
			}
			return false;
		}
	};

	const copyFolders = async () => {
		const backup    = new ActiveXObject('Scripting.FileSystemObject');
		const library   = backup.GetFolder(libaryDir);
		const playlists = backup.GetFolder(playlistDir);
		const configs   = backup.GetFolder(make ? `${fb.ProfilePath}georgia-reborn\\configs` : `${backupPath}georgia-reborn\\configs`);
		const cfg       = backup.GetFolder(make ? cfgPathFb : `${backupPath}configuration`);

		// * If old or new version, copy the library, playlist and config files
		library.Copy(make ? backupPath : `${fb.ProfilePath}`, true);
		playlists.Copy(make ? backupPath : `${fb.ProfilePath}`, true);
		configs.Copy(make ? `${backupPath}georgia-reborn\\configs` : `${fb.ProfilePath}georgia-reborn\\configs`, true);
		try { cfg.Copy(make ? `${backupPath}configuration` : cfgPathFb, true); } catch (e) {}

		// * Delete user's foo_ui_columns.dll.cfg, we use the clean cfg file from the zip
		try { backup.DeleteFile(`${backupPath}configuration\\foo_ui_columns.dll.cfg`, true); } catch (e) {}

		// * If old version, copy the old library data files
		if (oldVersion) {
			const indexData = backup.GetFolder(make ? `${fb.ProfilePath}index-data` : indexPath);
			indexData.Copy(make ? backupPath : `${fb.ProfilePath}`, true);
			return;
		}

		// * If new version, copy the new fb2k v2 files
		const dspPresets = backup.GetFolder(make ? dspPathFb : dspPathBp);
		const dspConfig = backup.GetFile(make ? `${fb.ProfilePath}config.fb2k-dsp` : `${backupPath}config.fb2k-dsp`);
		const fbConfig = backup.GetFile(make ? `${fb.ProfilePath}config.sqlite` : `${backupPath}config.sqlite`);
		const metadb = backup.GetFile(make ? `${fb.ProfilePath}metadb.sqlite` : `${backupPath}metadb.sqlite`);
		dspPresets.Copy(make ? backupPath : `${fb.ProfilePath}`, true);
		dspConfig.Copy(make ? backupPath : `${fb.ProfilePath}`, true);
		fbConfig.Copy(make ? backupPath : `${fb.ProfilePath}`, true);
		metadb.Copy(make ? backupPath : `${fb.ProfilePath}`, true);
	};

	const makeBackup = async () => {
		await checkVersion();
		await createFolders();

		if (!checkFolders()) return;

		await grm.settings.setThemeSettings(true);
		await copyFolders();

		if (Detect.Wine || !Detect.IE) { // Disable fancy popup on Linux or if no IE is installed, otherwise it will crash and is not yet supported
			const msgFb = `>>> Theme backup has been successfully saved <<<\n\n${fb.ProfilePath}backup`;
			fb.ShowPopupMessage(msgFb, 'Theme backup');
		} else {
			const msg = `Theme backup has been successfully saved:\n\n${fb.ProfilePath}backup\n\n\n`;
			lib.popUpBox.confirm('Georgia-ReBORN', msg, 'OK', false, false, 'center', false);
		}
	};

	const restoreBackup = async () => {
		if (!checkFolders()) return;

		grSet.restoreBackupPlaylist = true;

		await checkVersion();
		await copyFolders();
		await grm.settings.setThemeSettings(false, true);
		setTimeout(() => { fb.RunMainMenuCommand('File/Restart'); }, 1000);
	};

	if (make) {
		makeBackup();
	} else {
		restoreBackup();
	}
}


/**
 * Restores the backup playlist directory with its playlists.
 * This is a foobar workaround fix when user has installed and launched foobar for the very first time after installation.
 * If theme backup has been successfully restored, foobar automatically deletes all restored playlist files in the playlist directory.
 * On the next foobar restart and initialization, foobar adds crap playlist files in the playlist directory making them useless.
 * To fix this issue, all playlist files from the backup directory will be copied and restored again.
 * @global
 */
function RestoreBackupPlaylist() {
	const plistOld = `${fb.ProfilePath}backup\\profile\\playlists-v1.4`;
	const plistNew = `${fb.ProfilePath}backup\\profile\\playlists-v2.0`;

	let playlistDir;

	const checkVersion = async () => {
		if      (IsFolder(plistOld)) { playlistDir = plistOld; }
		else if (IsFolder(plistNew)) { playlistDir = plistNew; }
	};

	const checkFolders = () => {
		// * Safeguard to prevent crash when directories do not exist
		const foldersExist = IsFolder(plistOld) || IsFolder(plistNew);

		if (foldersExist) {
			return true;
		}
		else {
			fb.ShowPopupMessage(`>>> Georgia-ReBORN restore backup was aborted <<<\n\n"playlist" directory does not exist in:\n${fb.ProfilePath}backup`, 'Theme backup');
			return false;
		}
	};

	const copyFolders = async () => {
		const backup = new ActiveXObject('Scripting.FileSystemObject');
		const playlists = backup.GetFolder(playlistDir);
		playlists.Copy(`${fb.ProfilePath}`, true);
	};

	const restoreBackup = async () => {
		grSet.restoreBackupPlaylist = false;
		if (!checkFolders()) return;

		await checkVersion();
		await copyFolders();
		await grm.settings.setThemeSettings(false, true);
		console.log('\n>>> Georgia-ReBORN theme backup has been successfully restored <<<\n\n');
		setTimeout(() => { fb.RunMainMenuCommand('File/Restart'); }, 1000);
	};

	restoreBackup();
}


/**
 * Displays red rectangles to show all repaint areas when activating "Draw areas" in dev tools, used for debugging.
 * @global
 */
function RepaintRectAreas() {
	const originalRepaintRect = window.RepaintRect.bind(window);

	window.RepaintRect = (x, y, w, h, force = undefined) => {
		if (grm.ui.drawRepaintRects) {
			grm.ui.repaintRects.push({ x, y, w, h });
			window.Repaint();
		} else {
			grm.ui.repaintRectCount++;
			originalRepaintRect(x, y, w, h, force);
		}
	};
}


/**
 * Prints logs for window.Repaint() in the console, used for debugging.
 * @global
 */
function RepaintWindow() {
	DebugLog('Repainting from RepaintWindow()');
	window.Repaint();
}


/**
 * Continuously repaints rectangles for a short period of time ( 1 sec ), used when changing the layout width.
 * @global
 */
function RepaintWindowRectAreas() {
	DebugLog('Repainting from RepaintWindowRectAreas()');
	const originalRepaintRect = window.RepaintRect.bind(window);

	window.RepaintRect = () => {
		window.Repaint();
	};

	setTimeout(() => {
		window.RepaintRect = originalRepaintRect;
	}, 1000);
}


/**
 * Displays a popup with customizable message and button labels.
 * The behavior of the popup depends on the environment; if running under Wine or without Internet Explorer,
 * it will show a simple popup message. Otherwise, it will show a confirm box with two buttons.
 * @global
 * @param {boolean} fbPopup - Determines if the fb.ShowPopupMessage should be shown.
 * @param {string} fbMsg - The message to be displayed in the fb.ShowPopupMessage popup.
 * @param {string} popUpMsg - The message to be displayed in the confirm box popup.
 * @param {string} btn1Label - The label for the first button in the confirm box.
 * @param {string} btn2Label - The label for the second button in the confirm box. If not provided, no second button is shown.
 * @param {Function} callback - The callback function that is called with the confirmation status.
 */
function ShowPopup(fbPopup, fbMsg, popUpMsg, btn1Label, btn2Label, callback) {
	const continue_confirmation = (status, confirmed) => {
		if (!confirmed) {
			callback(confirmed);
			return;
		}
		callback(confirmed);
	};

	if (Detect.Wine || !Detect.IE) { // Disable fancy popup on Linux or if no IE is installed, otherwise it will crash and is not yet supported
		continue_confirmation(false, btn1Label);
		if (fbPopup) fb.ShowPopupMessage(fbMsg, 'Georgia-ReBORN');
	}
	else {
		lib.popUpBox.confirm('Georgia-ReBORN', popUpMsg, btn1Label, btn2Label, false, 'center', btn2Label ? continue_confirmation : false);
	}
}


/**
 * Displays a popup message for the theme day/night mode.
 * If the mode is active, it provides an option to deactivate it.
 * @global
 */
function ShowThemeDayNightModePopup() {
	const msg = 'Theme day/night mode is active\nand has locked the theme.\n\nIn order to change themes,\nthis mode must be deactivated first.\n\nDeactivate it now?\n\n\n';
	const msgFb = 'Theme day/night mode has been deactivated in order to change themes.';

	ShowPopup(true, msgFb, msg, 'Yes', 'No', (confirmed) => {
		if (confirmed) grSet.themeDayNightMode = false;
	});
}


/**
 * Writes %GR_THEMECOLOR%, %GR_THEME%, %GR_STYLE%, %GR_PRESET% tags to music files via the Playlist or Library context menu.
 * @global
 */
function WriteThemeTags() {
	const plItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
	const libItems = new FbMetadbHandleList(lib.pop.getHandleList('newItems'));
	const items = grm.ui.displayLibrary && !grm.ui.displayPlaylist || grm.ui.displayLibrarySplit() && grm.ui.state.mouse_x < grm.ui.ww * 0.5 ? libItems : plItems;

	if (!items || items.Count === 0) return;

	const grTags = [];
	const themeColor = grSet.theme === 'random' ? ColToRgb(grCol.primary) : '';
	const theme = grSet.preset === false ? grSet.theme : '';
	const preset = grSet.preset !== false ? grSet.preset : '';
	let style = '';

	if (grSet.preset === false) {
		const styleOptions = [
			grSet.styleNighttime && 'styleNighttime',
			grSet.styleBevel && 'bevel',
			grSet.styleBlend && 'blend',
			grSet.styleBlend2 && 'blend2',
			grSet.styleGradient && 'gradient',
			grSet.styleGradient2 && 'gradient2',
			grSet.styleAlternative && 'alternative',
			grSet.styleAlternative2 && 'alternative2',
			grSet.styleBlackAndWhite && 'blackAndWhite',
			grSet.styleBlackAndWhite2 && 'blackAndWhite2',
			grSet.styleBlackReborn && 'blackReborn',
			grSet.styleRebornWhite && 'rebornWhite',
			grSet.styleRebornBlack && 'rebornBlack',
			grSet.styleRebornFusion && 'rebornFusion',
			grSet.styleRebornFusion2 && 'rebornFusion2',
			grSet.styleRandomPastel && 'randomPastel',
			grSet.styleRandomDark && 'randomDark',
			grSet.styleRebornFusionAccent && 'rebornFusionAccent',
			grSet.styleTopMenuButtons === 'filled' && 'topMenuButtons=filled',
			grSet.styleTopMenuButtons === 'bevel' && 'topMenuButtons=bevel',
			grSet.styleTopMenuButtons === 'inner' && 'topMenuButtons=inner',
			grSet.styleTopMenuButtons === 'emboss' && 'topMenuButtons=emboss',
			grSet.styleTopMenuButtons === 'minimal' && 'topMenuButtons=minimal',
			grSet.styleTransportButtons === 'bevel' && 'transportButtons=bevel',
			grSet.styleTransportButtons === 'inner' && 'transportButtons=inner',
			grSet.styleTransportButtons === 'emboss' && 'transportButtons=emboss',
			grSet.styleTransportButtons === 'minimal' && 'transportButtons=minimal',
			grSet.styleProgressBarDesign === 'rounded' && 'progressBarDesign=rounded',
			grSet.styleProgressBarDesign === 'lines' && 'progressBarDesign=lines',
			grSet.styleProgressBarDesign === 'blocks' && 'progressBarDesign=blocks',
			grSet.styleProgressBarDesign === 'dots' && 'progressBarDesign=dots',
			grSet.styleProgressBarDesign === 'thin' && 'progressBarDesign=thin',
			grSet.styleProgressBar === 'bevel' && 'progressBarBg=bevel',
			grSet.styleProgressBar === 'inner' && 'progressBarBg=inner',
			grSet.styleProgressBarFill === 'bevel' && 'progressBarFill=bevel',
			grSet.styleProgressBarFill === 'inner' && 'progressBarFill=inner',
			grSet.styleProgressBarFill === 'blend' && 'progressBarFill=blend',
			grSet.styleVolumeBarDesign === 'rounded' && 'volumeBarDesign=rounded',
			grSet.styleVolumeBar === 'bevel' && 'volumeBarBg=bevel',
			grSet.styleVolumeBar === 'inner' && 'volumeBarBg=inner',
			grSet.styleVolumeBarFill === 'bevel' && 'volumeBarFill=bevel',
			grSet.styleVolumeBarFill === 'bevel' && 'volumeBarFill=inner'
		];

		// * Filter out the empty strings and join the remaining ones
		style = styleOptions.filter(Boolean).join('; ');
	}

	for (let i = 0; i < items.Count; ++i) {
		grTags.push({
			GR_THEMECOLOR: themeColor,
			GR_THEME: theme,
			GR_STYLE: style,
			GR_PRESET: preset
		});
	}

	if (items.Count) items.UpdateFileInfoFromJSON(JSON.stringify(grTags));
}
