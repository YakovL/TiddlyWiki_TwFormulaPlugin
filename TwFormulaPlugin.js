/***
|Name       |TwFormulaPlugin|
|Description|Render beautiful formulas using LaTeX syntax in wrappers like {{{$$...$$}}}. Plugin supports different libraries for that (MathJax, KaTeX, jqMath, MathQuill) – the supported LaTeX subset and some features depend on the selected library (MathQuill provides WYSIWYGish editing) {{DDnc{''retest''}}}|
|Version    |0.7.1|
|Source     |https://github.com/YakovL/TiddlyWiki_TwFormulaPlugin/blob/master/TwFormulaPlugin.js|
|Demo       |https://YakovL.github.io/TiddlyWiki_TwFormulaPlugin|
|Previous contributors|Forked from ~PluginMathJax v1.3, by an anonymous author (called themselves "[[Canada East|http://tiddlywiki.canada-east.ca/]]"); jqMath was added thanks to [[this|https://groups.google.com/forum/#!topic/tiddlywiki/PNXaylx1HRY]] thread and the prototype provied by Eric Schulman|
|Notes      |The plugin was pre-released as ~TwFormula''e''Plugin, but the name was simplified for the release. It still populates {{{version.extensions.TwFormulaePlugin}}} for the "install only once" functionality.|
!!!Installation and configuring
Install the plugin as usual (copy with the {{{systemConfig}}} tag, reload). By default, it will use ~KaTeX from a CDN (remote server).

//If you'd like to load ~KaTeX from the another source// (for instance, from a local folder), download the latest [[release|https://github.com/KaTeX/KaTeX/releases]], unpack all the files into a folder, like {{{./jsLibs/KaTeX/}}} (so that if your TW is {{{folder/TW.html}}}, the katex.min.js, for instance, is in {{{folder/jsLibs/KaTeX/katex.min.js}}}; same for {{{katex.min.css}}}, etc), and set the path <<option txtMathLibPath>> to that path or url ({{{jsLibs/KaTeX/}}} in this case).

//If you'd like to use another supported library,//
# put one of the lib names (listed in code in {{{libsConfig}}}) here: <<option txtMathLib>> {{DDnc{implement a select for an option macro instead}}};
# get the files from _ {{DDnc{explain, where}}}, put them in _ {{DDnc{explain, where}}};
# reload TW (this is applied on startup).

!!!Usage and examples
The plugin introduces several formatters to write math. For instance $a^2 + b^2$ is an inline formula, which can be written as {{{$ a^2 + b^2 $}}} and {{{\( a^2 + b^2 \)}}} (spaces are optional: {{{$a^2 + b^2$}}} will produce the same result). To write an ordinary {{{$}}}, write {{{\$}}} {{DDnc{make optional backward compatibility (disabling .. formatter)?}}}

In other cases, you may need a centered block formula like this:
$$ P(E) = {n \choose k} p^k (1 - p)^{n - k} $$
This can be inserted via the {{{$$ ... $$}}} and {{{\[ ... \]}}} wrappers. Note that to get \$\$ as plain text, you'll need {{{\$\$}}} (and not {{{\$$}}}).

{{DDnc{startup vs reload tiddlers}}}

!!!Cross-library compatibility
Different libraries implement different subsets of ~LaTeX, so it's not like you can use any of them for any formula. {{{MathJax}}} presumably still supports a larger subset, but {{{KaTeX}}} is greatly faster, so this is the default option.

{{{MathQuill}}} implements ~WYSIWYGish editing, but doesn't implement many advanced ~LaTeX commands like {{{ {n \choose k} }}}.

!!!WYSIWYG with {{{MathQuill}}}
To edit a formula with {{{MathQuill}}}, simply click inside the box (create an empty one with {{{$ $}}} → $ $) and start typing (use arrows to navigate, try pressing {{{a}}}, {{{^}}}, {{{delete}}} to see how such bits are managed, also try selecting things using shift and arrows).

If you'd like to save the result, press {{{enter}}}. It will refresh things, so don't keep several unsaved drafts at the same time.

Please note that if {{{MathQuill}}} doesn't support some ~LaTeX bits used in a formula, it will show it blank; trying to paste unsupported ~LaTeX results in no change (not pasted).
***/
//{{{
// =================================================================
//			   Configure lib and path, install only once
// =================================================================

var libsConfig = {
	// jsMath is not supported in this version as a deprecated solution
	MathJax: {
		libPath: 'http://cdn.mathjax.org/mathjax/latest/'
	},
	KaTeX: {
		libPath: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/'
	},
	jqMath: {
	},
	MathQuill: {
		libPath: 'https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/'
	}
}

var defaultLib = 'KaTeX'

var getLibPath = function(lib) {
	if(config.options.txtMathLibPath) return config.options.txtMathLibPath

	if(!lib) lib = config.options.txtMathLib
	if(!libsConfig[lib]) lib = defaultLib
	return libsConfig[lib].libPath
}
config.options.txtMathLib = config.options.txtMathLib || defaultLib
config.options.txtMathLibPath = config.options.txtMathLibPath || getLibPath()
var selectedLib = libsConfig[config.options.txtMathLib]

;(function main() {
	// install only once, notify if there's another copy of formulae plugin
	if(version.extensions.PluginMathJax || version.extensions.TwFormulaePlugin || window.jsMath) {
		alert("TwFormulaPlugin: another copy of PluginMathJax or TwFormulaePlugin/TwFormulaPlugin is installed or jsMath is loaded")
		return
	}
	version.extensions.TwFormulaePlugin = { installed: true }

	var ie9RegExp = /^9\./
	var UseInnerHTML = (config.browser.isOpera || config.browser.isIE && ie9RegExp.test(config.browser.ieVersion[1]))

// =================================================================
//			     Load the library and the styles
// =================================================================

var loadLib = function(path, config) {
	// jQuery.getScript requires xhr, so won't work locally (through file://)
	// http://stackoverflow.com/questions/7718935/load-scripts-asynchronously

	// create the script element and add it
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.src = path;
	
	if(UseInnerHTML)
		script.innerHTML = config;
	script.text = config;

	document.getElementsByTagName("head")[0].appendChild(script);

	return script
}
var loadCSS = function(path) {
	jQuery("head").append("<link rel='stylesheet' type='text/css' href='" + path + "' />");
/*	// without jQuery: https://stackoverflow.com/a/5186760/3995261
	var stylesheet = document.createElement('link');
	stylesheet.href = path;
	stylesheet.rel = 'stylesheet';
	stylesheet.type = 'text/css';
	document.getElementsByTagName('head')[0].appendChild(stylesheet);
*/
}

switch(selectedLib) {
	case libsConfig.MathJax:
		var mjConfig =
			'MathJax.Hub.Config({' +
				'jax: ["input/TeX","output/HTML-CSS"],' +
				'extensions: ["TeX/AMSmath.js", "TeX/AMSsymbols.js"],' +
				'"HTML-CSS": {' +
					'scale: 115' +
				'}' +
			'});' +
			'MathJax.Hub.Startup.onload();'

		loadLib(getLibPath() + "MathJax.js", mjConfig)
	break;
	case libsConfig.KaTeX:
		var kaTeXpath = getLibPath()
		loadLib(kaTeXpath + "katex.min.js")
		loadCSS(kaTeXpath + "katex.min.css")
	break;
	case libsConfig.MathQuill:
		var mathQuillPath = getLibPath()
		loadLib(mathQuillPath + "mathquill.min.js")
		var loadMQ = function() { try{
			config.extensions.mathQuill = MathQuill.getInterface(2)
		} catch(e) { setTimeout(loadMQ, 50) } }
		loadMQ()
		loadCSS(mathQuillPath + "mathquill.min.css")
		// div = outline formula
		var mathQuillCssExtras =
			"div.mq-editable-field { display: block; text-align: center; }\n"+
			"   .mq-editable-field { border: thin solid #cccccc; }"
		setStylesheet(mathQuillCssExtras, "mathQuillCssExtras")
	break;

	case libsConfig.jqMath:
		setStylesheet(store.getTiddlerText("JQMath.css"), "jqMathStyles")
	break;
	// jsMath is not implemented in this version
}

// =================================================================
//	   Define helpers for wikitext editing through WYSIWYG
// =================================================================

var changeWikiText = function(sourceTiddler, startPosition, oldLatexLength, openWrapper, closeWrapper, newLatex) {

	// prepare texts and positions
	var noTiddlerMsg = "changeWikiText: no sourceTiddler detected"
	if(!sourceTiddler) return console.log(noTiddlerMsg)

	var oldLenght = openWrapper.length + oldLatexLength + closeWrapper.length

	sourceTiddler.text = sourceTiddler.text.substr(0, startPosition) +
		openWrapper + newLatex + closeWrapper +
		sourceTiddler.text.substr(startPosition + oldLenght)

	// recalcs slices, notify, etc.
	store.saveTiddler(sourceTiddler)
};

// =================================================================
//	   Define formatters and hijack wikifying for latex
// =================================================================

config.formatterHelpers.mathFormatHelper = function(w) {

	var endRegExp = new RegExp(this.terminator, "mg")
	endRegExp.lastIndex = w.matchStart + w.matchLength
	var match = endRegExp.exec(w.source)
	if(!match) return

	var latex = this.keepdelim ?
		w.source.substr(w.matchStart, match.index + match[0].length - w.matchStart) :
		w.source.substr(w.matchStart + w.matchLength, match.index - w.matchStart - w.matchLength);

// pre-parsing can be done here
latex = latex.replace(/\\?π/mg, "\\pi").replace("×", "\\times").replace("∞", "\\infty");

	var e = document.createElement(this.element);
	if(selectedLib == libsConfig.MathJax)
		e.type = this.inline ? "math/tex" : "math/tex; mode=display";

	if(UseInnerHTML)
		e.innerHTML = latex;
	else
		e.text = latex;
	w.output.appendChild(e);
	if(selectedLib == libsConfig.jqMath)
		M.parseMath(e);
	if(selectedLib == libsConfig.KaTeX)
		try {
			katex.render(latex, e, {
				displayMode: !this.inline,
				throwOnError: false,
				errorColor: "#ff0000"
			});
		} catch(e) {
			if(!(e.message == "katex is not defined"))
				console.log("katex exception:");
			console.log(e);
		}
	if(selectedLib == libsConfig.MathQuill)
	{ try{
		var mqEditor = config.extensions.mathQuill.MathField(e, {
			spaceBehavesLikeTab: true, // ??
			handlers: {
				edit: function() {
					// do onchange stuff here
					// use mathQuillEditor.latex()
					//  to either set or get latex
				}
			}
		});
		mqEditor.latex(latex);

		var tid = w.tiddler,
			startPos = w.matchStart,
			openWrapper = this.openWrapper,
			closeWrapper = this.closeWrapper;
		jQuery(e).keydown(function(e) {
			// on press enter, apply changes
			if(e.key == 'Enter')
				changeWikiText(tid, startPos, latex.length, openWrapper, closeWrapper, mqEditor.latex())
		});
	} catch(e) { console.log("MathQuill formatter: " + e.message) } }

	w.nextMatch = endRegExp.lastIndex
};

var mainMathFormatters = [
	{
		name: "displayMath1",
		// used for editing, would be nice to generate from it:
		// closeWrapper, match, terminator and termRegExp
		openWrapper: "$$",
		closeWrapper: "$$",
		match: "\\\$\\\$",
		terminator: "\\\$\\\$\\n?",
		termRegExp: "\\\$\\\$\\n?",
		element: (selectedLib == libsConfig.MathJax ? "script" : "div"),
		inline: false,
		keepdelim: (selectedLib == libsConfig.jqMath),
		handler: config.formatterHelpers.mathFormatHelper
	},{
		name: "inlineMath1",
		// used for editing, would be nice to generate from it:
		// closeWrapper, match, terminator and termRegExp
		openWrapper: "$",
		closeWrapper: "$",
		match: "\\\$", 
		terminator: "\\\$",
		termRegExp: "\\\$",
		element: (selectedLib == libsConfig.MathJax ? "script" : "span"),
		inline: true,
		keepdelim: (selectedLib == libsConfig.jqMath),
		handler: config.formatterHelpers.mathFormatHelper
	}
];

var backslashFormatters = [
	{
		name: "inlineMath2",
		// used for editing, would be nice to generate from it: match
		openWrapper: "\\(",
		// ~ : terminator and termRegExp
		closeWrapper: "\\)",
		match: "\\\\\\\(",
		terminator: "\\\\\\\)",
		termRegExp: "\\\\\\\)",
		element: (selectedLib == libsConfig.MathJax ? "script" : "span"),
		inline: true,
		keepdelim: (selectedLib == libsConfig.jqMath),
		handler: config.formatterHelpers.mathFormatHelper
	},{
		name: "displayMath2",
		// used for editing, would be nice to generate from it: match
		openWrapper: "\\[",
		// ~ : terminator and termRegExp
		closeWrapper: "\\]",
		match: "\\\\\\\[",
		terminator: "\\\\\\\]\\n?",
		termRegExp: "\\\\\\\]\\n?",
		element: (selectedLib == libsConfig.MathJax ? "script" : "div"),
		inline: false,
		keepdelim: (selectedLib == libsConfig.jqMath),
		handler: config.formatterHelpers.mathFormatHelper
	},{
		name: "displayMath3",
		// used for editing, would be nice to generate from it: match
		openWrapper: "\\begin{equation}",
		// ~ : terminator and termRegExp
		closeWrapper: "\\end{equation}",
		match: "\\\\begin\\{equation\\}",
		terminator: "\\\\end\\{equation\\}\\n?",
		termRegExp: "\\\\end\\{equation\\}\\n?",
		element: (selectedLib == libsConfig.MathJax ? "script" : "div"),
		inline: false,
		keepdelim: (selectedLib == libsConfig.jqMath),
		handler: config.formatterHelpers.mathFormatHelper
	},{
		// These can be nested.  e.g. \begin{equation} \begin{array}{ccc} \begin{array}{ccc} ...

		name: "displayMath4",
		// used for editing, would be nice to generate from it: match
		openWrapper: "\\begin{eqnarray}",
		// ~ : terminator and termRegExp
		closeWrapper: "\\end{eqnarray}",
		match: "\\\\begin\\{eqnarray\\}",
		terminator: "\\\\end\\{eqnarray\\}\\n?",
		termRegExp: "\\\\end\\{eqnarray\\}\\n?",
		element: (selectedLib == libsConfig.MathJax ? "script" : "div"),
		inline: false,
		keepdelim: true,
		handler: config.formatterHelpers.mathFormatHelper
	},{
		// The escape must come between backslash formatters and regular ones.
		// So any latex-like \commands must be added to the beginning of
		// backslashformatters here.

		name: "escape",
		match: "\\\\.",
		handler: function(w) {
			var escapedCharacter = w.source.substr(w.matchStart + 1, 1)
			w.output.appendChild(document.createTextNode(escapedCharacter))
			w.nextMatch = w.matchStart + 2 // 2 = length of \.
		}
	}
];

config.formatters = config.formatters.concat(mainMathFormatters, backslashFormatters)
// if the plugin is loaded via TIFP or other async means, formatter may be set already
if(formatter) formatter = new Formatter(config.formatters)

if(selectedLib == libsConfig.MathJax) {
	old_wikify = wikify
	wikify = function(source, output, highlightRegExp, tiddler) {
		old_wikify.apply(this, arguments)
		if(window.MathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, output])
	};
}

})();
//}}}