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
var path = require("path"),
	log4js = require('log4js'),
	logger = log4js.getLogger("lsregistry");

var _byContentType = new Map(),
	_uninitialized = Object.create(null),
	_registeredTypes = Object.create(null);

/**
 * @name module.exports.installServer
 * @description Installs a language server with the given options
 * @function
 * @param {?} impl The implementation of the language server
 * @param {?} options The map of options to use when installing the server
 * @since 17.0
 */
module.exports.installServer = function installServer(impl, options) {
	if(!options || !options.io) {
		logger.error("Failed to install language server: no socketio implementation was given");
		return;
	}
	var socketio = options.io;
	if(typeof impl.id === 'string' && Array.isArray(impl.contentType)) {
		impl.contentType.forEach(contentType => {
			if(typeof contentType === 'string') {
				var servs = _byContentType.get(contentType);
				if(!Array.isArray(servs)) {
					servs = [];
				}
				servs.push(impl);
				_byContentType.set(contentType, servs);
				_registeredTypes[contentType] = true;
			}
		});
		socketio.of(impl.route).on('connect', function(socket) {
			socket.on('start', /* @callback */ function(msg) {
				var receiveFromServer = net.createServer({}, function(stream) {
					logger.info('receiveFromServer socket connected');
					stream.on('data', function(data) {
						parseMessage(data, workspaceUrl, socket);
						if(typeof impl.onStreamData === 'function') {
							impl.onStreamData();
						}
					});
					stream.on('error', function(err) {
						logger.error('receiveFromServer stream error: ' + err.toString());
						if(typeof impl.onStreamError === 'function') {
							impl.onStreamError(err);
						}
					});
					stream.on('end', function() {
						logger.info('receiveFromServer disconnected');
						if(typeof impl.onStreamEnd === 'function') {
							impl.onStreamEnd(stream);
						}
					});
				});
				receiveFromServer.listen(IN_PORT, null, null, function() {
					logger.info("Listening to lsp server replies");
					if(typeof impl.onListen === 'function') {
						impl.onServerListen();
					}
				});
				receiveFromServer.on('error', function(err) {
					logger.error('receiveFromServer error: ' + err.toString());
					if(typeof impl.onServerError === 'function') {
						impl.onServerError(err);
					}
				});
				receiveFromServer.on('end', function() {
					logger.info('Disconnected receiveFromServer');
					if(typeof impl.onServerEnd === 'function') {
						impl.onServerEnd();
					}
				});
				impl.onStart(msg);
			}.bind(impl));
		}.bind(impl));
	}
};

module.exports.connectServers = function connectServers(options, socketio) {
	Object.keys(_uninitialized).forEach(function(key) {
		if(typeof _uninitialized[key].connect === 'function') {
			try {
				_uninitialized[key].connect(options, socketio);
			}
			catch(err) {
				throw new Error("Could not connect language server '"+key+"', exception: "+err);
			} finally {
				delete _uninitialized[key];
			}
		} else {
			throw new Error("Could not connect language server '"+key+"' because it does not have a connect function");
		}
	});
};

/**
 * @name module.exports.findLanguageServers
 * @description Looks up all the registered language servers for the given content type
 * @function
 * @param {string} contentType The content type
 * @returns {[?]} Returns the array of language servers for the given content type or the empty array is none ara registered
 * @since 17.0
 */
module.exports.findLanguageServers = function findLanguageServers(contentType) {
	if(typeof contentType === 'string' && contentType) {
		var ls = _byContentType.get(contentType);
		if(Array.isArray(ls)) {
			return ls;
		}
	}
	return [];		
};

/**
 * @name module.exports.registeredServers
 * @description Returns the array of regiistered content types that have language servers available
 * @function
 * @returns {[string]} The array of content type ids that have language servers registered
 * @since 17.0
 */
module.exports.registeredServers = function registeredServers() {
	return Object.keys(_registeredTypes);	
};