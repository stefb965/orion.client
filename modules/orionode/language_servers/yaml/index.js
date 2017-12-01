/*******************************************************************************
 * Copyright (c) 2013, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/

module.exports.createServer = function createServer() {
	return new YamlLanguageServer();
}

/**
 * @description Create a new YAML language server
 * @constructor
 * @since 17.0
 */
function YamlLanguageServer() {
}

Object.assign(YamlLanguageServer.prototype, {
	route: '/yaml',
	contentType: ["text/x-yaml"],
	name: 'YAML language server',
	id: 'yaml.language.server',
	onStart: function onStart() {

	}
});