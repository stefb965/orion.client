/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
define([
	'orion/URITemplate',
	'i18n!javascript/nls/messages',
	'orion/i18nUtil'
], function(URITemplate, Messages, i18nUtil) {

	var astmanager;

	/**
	 * @name javascript.JavaScriptHover
	 * @description creates a new instance of the hover
	 * @constructor
	 * @public
	 * @param {kubernetes.AstManager} astManager
	 */
	function KubeHover(astManager) {
		astmanager = astManager;
	}

	/**
	 * @description Formats the hover info as markdown text
	 * @param {String} node The text to format
	 * @returns returns
	 */
	function formatMarkdownHover(comment, offsetRange) {
		if (!comment) {
			return null;
		}
		//TODO
		return null;
	}

	function doHover(ast, ctxt, meta, htmlsource) {

	}
	
	/**
	 * @description Formats the list of files as links for the hover
	 * @function
	 * @private
	 * @param {String} path The path we are navigating to
	 * @param {Array.<javascript.ScriptResolver.File>} files The array of files to linkify
	 * @returns {String} The mardown to show in the hover
	 */
	function formatFilesHover(path, files) {
		if (path && files) {
			var title = null;
			if (files.length > 1) {
				title = i18nUtil.formatMessage('###${0} \'${1}\'###', Messages['openFileForTitle'], path); //$NON-NLS-1$
			}
			var hover = '';
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (file.name && file.path && file.contentType) {
					hover += '[';
					var href = new URITemplate("#{,resource,params*}").expand( //$NON-NLS-1$
						{
							resource: file.location,
							params: {}
						});
					hover += file.name + '](' + href + ') - ' + file.path + '\n\n'; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$
				}

			}
			return {
				title: title,
				content: hover,
				type: 'markdown',
				allowFullWidth: true
			};
		}
		return null;
	}
	
	/**
	 * @description Callback from the editor to compute the hover
	 * @function
	 * @public
	 * @memberof javascript.JavaScriptOccurrences.prototype
	 * @param {?} editorContext The current editor context
	 * @param {?} ctxt The current selection context
	 */
	KubeHover.prototype.computeHoverInfo = function computeHoverInfo(editorContext, ctxt) {
		if (ctxt.proposal && ctxt.proposal.kind === 'kube') {
			return ctxt.proposal.hover;
		}
		return editorContext.getFileMetadata().then(function(meta) {
			return editorContext.getText().then(function(text) {
				return astmanager.getAST(editorContext).then(function(ast) {
					return doHover(ast, ctxt, meta, text);
				});
			});
		});

	};

	return KubeHover;
});