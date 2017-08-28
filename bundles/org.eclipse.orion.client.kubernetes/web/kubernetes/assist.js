/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Various improvements
 ******************************************************************************/
/*eslint-env amd, browser, node */
define([
	'kubernetes/templates',
	'i18n!kubernetes/nls/messages',
	'orion/editor/templates',
	'orion/i18nUtil'
], function(KubeTemplates, Messages, mTemplates, i18nUtil) {

	var astmanager,
		project;
		
	/**
	 * @description Creates a new KubeAssist object
	 * @constructor
	 * @public
	 * @param {kubernetes.ASTManager} astManager An AST manager to create ASTs with
	 * @param {KubeProject} kubeProject The backing Kubernetes project
	 */
	function KubeAssist(astManager, kubeProject) {
		astmanager = astManager;
		project = kubeProject;
	}

	function getPrefixStart(text, offset) {
		var index = offset;
		while (index > 0) {
			var char = text.substring(index - 1, index);
			if (/[A-Za-z0-9_$]/.test(char)) {
				index--;
			} else {
				break;
			}
		}
		return index;
	}

	/**
	 * @description Perform the actual computation
	 * @param {?} ast The backing AST
	 * @param {?} params The assist activation parameters
	 */
	function doAssist(ast, params, meta, envs, htmlsource) {
		return project.getComputedEnvironment().then(function(cenv) {
			//TODO
			return KubeTemplates.getTemplatesFor(params);
		});
	}
	/**
	 * @callback 
	 */
	KubeAssist.prototype.computePrefix = function computePrefix(editorContext, offset) {
		return editorContext.getText().then(function(text) {
			return text.substring(getPrefixStart(text, offset), offset);
		});
	};
	/**
	 * Called by the framework to initialize this provider before any <tt>computeContentAssist</tt> calls.
	 */
	KubeAssist.prototype.initialize = function initialize() {
		//override
	};

	/**
	 * @description Implements the Orion content assist API v4.0
	 */
	KubeAssist.prototype.computeContentAssist = function computeContentAssist(editorContext, params) {
		return editorContext.getFileMetadata().then(function(meta) {
			return astmanager.getAST(editorContext).then(function(ast) {
				return doAssist(ast, params, meta, {
					ecma5: true,
					ecma6: true,
					ecma7: true
				});
			});
		});
	};


	return KubeAssist;
});