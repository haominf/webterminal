/**
 * Script includes dom representation object, log object and basic prototypes.
 */

String.prototype.splice = function(position, length, string) {
    return (this.slice(0,position) + string + this.slice(position + Math.abs(length)));
};

function Clone(source) {
    for (var i in source) {
        if (!source.hasOwnProperty(i)) continue;
        if (typeof source[i] == 'source') {
            this[i] = new Clone(source[i]);
        }
        else{
            this[i] = source[i];
        }
    }
}

/**
 * Merges two objects recursively that each property of sourceObject will appear in object.
 *
 * @param {object} object
 * @param {object} sourceObject
 */
var mergeObjects = function (object, sourceObject) {

    var combine = function(target, object) {

        for (var property in object) {

            if (!object.hasOwnProperty(property)) continue;
            if (typeof object[property] != "object") {
                target[property] = object[property];
            } else {
                target[property] = new Clone(object[property]);
            }

        }

    };

    combine(object, sourceObject);

};

//Object.prototype.merge = function(object) {
//
//    var combine = function(target,object) {
//
//        for (var property in object) {
//
//            if (!object.hasOwnProperty(property)) continue;
//            if (typeof object[property] != "object") {
//                target[property] = object[property];
//            } else {
//                target[property] = new Clone(object[property]);
//            }
//
//        }
//
//    };
//
//    combine(this,object);
//
//};

var log = new function() {
    this.write = function() {
        (window.console && console.log)?console.log.apply(console, arguments):alert(arguments.join(", "));
    }
};

/**
 * This object represents every dom element needed for terminal application and includes methods to work with graphical
 * part of web terminal. See [objects] property for more information.
 */
var dom = new function() {

    var isDomElement = function(object) {
        return (
            typeof HTMLElement === "object" ? object instanceof HTMLElement: //DOM2
                object && typeof object === "object" && object !== null && object.nodeType === 1 &&
                    typeof object.nodeName === "string"
            );
    };

    /**
     * DOM objects to work with.
     *
     * @type {object}
     */
    this.objects = {
        namespace: null, // current namespace holder
        input: null, // input object (hidden input, main user-accessible input)
        output: null, // terminal output
        inputView: null, // input view (highlighted syntax)
        panel: null,
        terminal: null,
        panelTable: null,
        closePanelButton: null,
        settingsHighlighting: null,
        settingsAnimations: null,
        settingsAutoSaving: null,
        settingsCleanStartup: null,
        settingsParseOutput: null,
        themeCSS: null,
        themesContainer: null,
        languagesContainer: null,
        body: null,
        startupScript: null,

        getCaretPosition: function(object) {
            object.focus();
            if(object.selectionStart) return object.selectionStart;
            else if(!document.selection) return 0;
            var c = "\001";
            var sel	= document.selection.createRange();
            var dul	= sel.duplicate();
            dul.moveToElementText(object);
            sel.text = c;
            var len = dul.text.indexOf(c);
            sel.moveStart("character", -1);
            sel.text = "";
            return len;
        },
        
        getThemeSelectorObject: function(themeName) {
            return dom.element("terminal-color-theme-" + themeName);
        },

        getLanguageSelectorObject: function(langName) {
            return dom.element("terminal-language-unit-" + langName);
        }
    };

    /**
     * Adds class to object.
     *
     * @param object
     * @param className
     */
    this.addClass = function(object, className) {
        if (isDomElement(object)) {
            object.className += className;
        } else log.write("Can't add class to non-DOM element.");
    };

    /**
     * Removes class from object.
     *
     * @param object
     * @param className
     */
    this.removeClass = function(object, className) {
        if (isDomElement(object)) {
            var regExp = new RegExp("(?:^|\\s)" + className + "(?!\\S)","g");
            object.className = object.className.replace(regExp,"");
        } else log.write("Can't remove class from non-DOM element.");
    };

    /**
     * Clear all logs before.
     */
    this.clearOutput = function() {
        this.objects.output.innerHTML = "";
    };

    /**
     * Scrolls to the bottom of the page.
     */
    this.scrollBottom = function() {
        try {
            var h = document.body.scrollHeight;
            if (dom.objects.terminal.scrollHeight + 40 < h) return;
            document.body.scrollTop = document.body.scrollHeight;
            window.scrollTo(0, document.body.scrollHeight);
        } catch (e) {

        }
    };

    /**
     * Returns true while input element in dom under focus.
     *
     * @returns {boolean}
     */
    this.focused = function(object) {
        return (document.activeElement == object);
    };

    this.performForClassObjects = function(className,handler) {
        var classes = document.getElementsByClassName(className);
        for (var i = 0; i < classes.length; i++) {
            handler.call(classes[i], classes[i]);
        }
    };

    /**
     * Gets focused object in dom.
     *
     * @returns {DocumentView}
     */
    this.getFocusedObject = function() {
        return document.activeElement;
    };

    /**
     * Returns element by ID.
     *
     * @param name
     * @returns {HTMLElement}
     */
    this.element = function(name) {
        return document.getElementById(name)
    };

    // definition of all required objects for terminal application in DOM
    var defineObjects = function(objects) {
        objects.namespace = dom.element("terminal-namespace");
        objects.input = dom.element("terminal-hiddenInput");
        objects.output = dom.element("terminal-output");
        objects.inputView = dom.element("terminal-inputView");
        objects.terminal = dom.element("terminal");
        objects.panel = dom.element("terminal-control-panel");
        objects.panelTable = dom.element("terminal-control-table");
        objects.closePanelButton = dom.element("terminal-control-closeButton");
        objects.settingsHighlighting = dom.element("settings-highlighting");
        objects.themeCSS = dom.element("terminal-color-theme");
        objects.settingsAnimations = dom.element("settings-animations");
        objects.settingsAutoSaving = dom.element("settings-autosaving");
        objects.settingsCleanStartup = dom.element("settings-cleanStartup");
        objects.themesContainer = dom.element("terminal-themes-container");
        objects.settingsParseOutput = dom.element("settings-parse-output");
        objects.languagesContainer = dom.element("terminal-languages-container");
        objects.startupScript = dom.element("startup");
        objects.body = document.body;
    };


    /**
     * Checks if every object defined in objects.
     *
     * @returns {boolean}
     *  Ready to work with terminal DOM.
     */
    this.objectsReady = function() {
        for (var object in this.objects) {
            if (!this.objects.hasOwnProperty(object) || typeof this.objects[object] != "object") continue;
            if (this.objects[object] == null) {
                log.write("DOM object " + object + " not found!");
                return false;
            }
        }
        return true;
    };

    /**
     * Initialize objects data.
     *
     * @returns {boolean}
     */
    this.initialize = function() {
        defineObjects.call(this,this.objects);

        for (var theme in application.themes) {
            if (!application.themes.hasOwnProperty(theme) || !theme) continue;
            this.objects.themesContainer.innerHTML += "<label><input id=\"terminal-color-theme-" + theme + "\" " +
                "type=\"radio\" name=\"terminal-color-scheme\" value=\"" + theme + "\">" + theme[0].toUpperCase() +
                theme.substr(1) + " </label>";
        }

        for (var l in lang.availableLanguages) {
            if (!lang.availableLanguages.hasOwnProperty(l) || !l) continue;
            this.objects.languagesContainer.innerHTML += "<label><input id=\"terminal-language-unit-" + l + "\" " +
                "type=\"radio\" name=\"terminal-language-unit\" value=\"" + l + "\">" + l.toUpperCase() + " </label>";
        }

        return this.objectsReady();
    };

    /**
     * Removes element from DOM.
     *
     * @param object
     *  DOM element to remove.
     * @returns {Node}
     *  Removed node or null, if object is not in DOM or not DOM object.
     */
    this.remove = function(object) {
        return (isDomElement(object))?object.parentNode.removeChild(object):null;
    };

};

/**
 * This object represents whole terminal panel functionality.
 */
var settings = new function() {

    var animations = true,
        highlighting = true,
        colorTheme = "default",
        restoreSession = 0,
        parseOutput = 0,
        cleanStartup = 0,
        fontAntialiasing = 0,
        language = "en";

    this.get_restoreSession = function() { return restoreSession == 1 };
    this.get_cleanStartup = function() { return cleanStartup == 1 && !terminal.ready };
    this.get_parseOutput = function() { return parseOutput };
    this.get_animations = function() { return animations };
    this.get_language = function() { return language };
    this.get_theme = function() { return colorTheme };

    this.export = function() {
        return {
            "!export:settings": true,
            animations: animations,
            highlighting: highlighting,
            colorTheme: colorTheme,
            restoreSession: restoreSession,
            cleanStartup: cleanStartup,
            parseOutput: parseOutput,
            language: language,
            fontAntialiasing: fontAntialiasing
        };
    };

    this.import = function(settingImportObject) {
        if (!(typeof settingImportObject === "object" && settingImportObject.hasOwnProperty("!export:settings") &&
            settingImportObject.hasOwnProperty("animations") && settingImportObject.hasOwnProperty("highlighting") &&
            settingImportObject.hasOwnProperty("colorTheme") && settingImportObject.hasOwnProperty("restoreSession") &&
            settingImportObject.hasOwnProperty("cleanStartup") && settingImportObject.hasOwnProperty("parseOutput") &&
            settingImportObject.hasOwnProperty("language") && settingImportObject.hasOwnProperty("fontAntialiasing"))) {
            log.write("Wrong settings object to import. Use /reset to restore settings.");
            return;
        }
        animations = settingImportObject["animations"];
        highlighting = settingImportObject["highlighting"];
        colorTheme = settingImportObject["colorTheme"];
        parseOutput = settingImportObject["parseOutput"];
        restoreSession = (settingImportObject["restoreSession"] == 1)?1:0;
        cleanStartup = settingImportObject["cleanStartup"];
        language = settingImportObject["language"];
        fontAntialiasing = settingImportObject["fontAntialiasing"];
        this.update();
    };

    this.reset = function() {
        animations = true;
        highlighting = true;
        colorTheme = "default";
        restoreSession = 0;
        parseOutput = 0;
        cleanStartup = 0;
        fontAntialiasing = 0;
        language = "en";
        this.update();
    };
    
    var applyDomSettings = function() {
	    
	    dom.objects.themeCSS.href = "css/theme-" + colorTheme + ".css";
        if (!animations) {
            dom.removeClass(dom.objects.body,"noAnimations");
            dom.addClass(dom.objects.body,"noAnimations");
        } else dom.removeClass(dom.objects.body,"noAnimations");
        
        var p = ["-webkit-font-smoothing", "font-smoothing", "-moz-osx-font-smoothing"];
        
        switch (parseInt(fontAntialiasing)) {
	    	case 0: {
		    	document.body.style[p[0]] = "none";
		    	document.body.style[p[1]] = "none";
		    	document.body.style[p[2]] = "none";
	    	} break;
	    	case 1: {
		    	document.body.style[p[0]] = "antialiased";
		    	document.body.style[p[1]] = "antialiased";
		    	document.body.style[p[2]] = "grayscale";
	    	} break;
	    	case 2: {
		    	document.body.style[p[0]] = "subpixel-antialiased";
		    	document.body.style[p[1]] = "subpixel-antialiased";
		    	document.body.style[p[2]] = "auto";
	    	} break;
        }
	    
    }

    /**
     * Updates terminal settings according to dom checked boxes.
     */
    this.updateFromView = function() {

        highlighting = dom.objects.settingsHighlighting.checked;
        animations = dom.objects.settingsAnimations.checked;
        restoreSession = (dom.objects.settingsAutoSaving.checked)?1:0;
        cleanStartup = (dom.objects.settingsCleanStartup.checked)?1:0;
        parseOutput =(dom.objects.settingsParseOutput.checked)?1:0;

        colorTheme = "default";
        for (var theme in application.themes) {
            if (!application.themes.hasOwnProperty(theme)) continue;
            var obj = dom.objects.getThemeSelectorObject(theme);
            if (!obj) continue;
            if (obj.checked) colorTheme = theme;
        }

        language = "en";
        for (var l in lang.availableLanguages) {
            if (!lang.availableLanguages.hasOwnProperty(l)) continue;
            var obj2 = dom.objects.getLanguageSelectorObject(l);
            if (!obj2) continue;
            if (obj2.checked) language = l;
        }
        
        fontAntialiasing = 0;
        var els = document.getElementsByName("settings-fontSmoothing");
        for (var ee in els) {
	     	if (!els.hasOwnProperty(ee)) continue;
			if (els[ee].checked) {
				fontAntialiasing = parseInt(els[ee].value);
			}
        }

        applyDomSettings();
        
        storage.set("settings", settings.export());

    };

    /**
     * Returns true if output needs to be highlighted.
     *
     * @returns {boolean}
     */
    this.highlightOutput = function() {
        return highlighting;
    };

    /**
     * Closes panel.
     */
    this.closePanel = function() {
        dom.objects.panel.style.left = "-100%";
    };

    /**
     * Closes panel.
     */
    this.openPanel = function() {
        dom.objects.panel.style.left = "0";
    };

    /**
     * Updates terminal settings view on dom.
     */
    this.updateFromModel = function() {
        dom.objects.settingsHighlighting.checked = highlighting;
        dom.objects.settingsAnimations.checked = animations;
        dom.objects.settingsParseOutput.checked = parseOutput;
        dom.objects.settingsAutoSaving.checked = restoreSession == 1;
        dom.objects.settingsCleanStartup.checked = cleanStartup == 1;
        
        for (var theme in application.themes) {
            if (!application.themes.hasOwnProperty(theme)) continue;
            var obj = dom.objects.getThemeSelectorObject(theme);
            if (!obj) continue;
            obj.checked = colorTheme === theme;
        }
        
        for (var l in lang.availableLanguages) {
            if (!lang.availableLanguages.hasOwnProperty(l)) continue;
            var obj2 = dom.objects.getLanguageSelectorObject(l);
            if (!obj2) continue;
            obj2.checked = language === l;
        }
        
        var els = document.getElementsByName("settings-fontSmoothing");
        for (var ee in els) {
	     	if (!els.hasOwnProperty(ee)) continue;
			els[ee].checked = (parseInt(els[ee].value) == fontAntialiasing)?true:false;
        }
    };

    this.update = function() {
        this.updateFromModel();
        this.updateFromView();
    };

    /**
     * Applies language to the document.
     */
    function translateDocument() {
        var e, l;
        for (var i = 0; i < lang.getLanguagesNumber(); i++) {
	        e = dom.element("lang-field-" + i);
	        if (e && (l = lang.get(i))) { e.innerHTML = l; }
        }
        /*while (e = dom.element("lang-field-" + i)) {
            e.innerHTML = lang.get(62 + i);
            i++;
        }*/
    }

    /**
     * Initializes settings. Returns true if initialization successful.
     *
     * @returns {boolean}
     */
    this.initialize = function() {
        dom.objects.panel.style.left = "-100%";
        var sets = storage.get("settings");
        if (sets) this.import(sets);
        if (restoreSession) terminal.loadState();
        hid.bindClick(dom.objects.panelTable,this.updateFromView);
        this.update();
        hid.bindClick(dom.objects.closePanelButton, function() { settings.closePanel() });
        hid.bindClick(dom.objects.languagesContainer,function(){
            var ih = this.hasAttribute("duck");
            if (!ih) {
                this.setAttribute("duck", "quack!");
                var s = document.createElement("span");
                s.innerHTML = " " + lang.get(61);
                this.appendChild(s);
            }
        });
        translateDocument();
        return true;
    }

};