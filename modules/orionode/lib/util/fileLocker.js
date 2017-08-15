/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var fs = require("fs-ext");
var log4js = require("log4js");

var logger = log4js.getLogger("server");

var APPEND = "a+";
var EXCLUSIVE = "ex";
var SHARED = "sh";
var UNLOCK = "un";

var ReentrantLock = function() {
	this._queue = [];
	this._outstandingCount = 0;
	this._sharedMode = false;
};

ReentrantLock.prototype.lock = function(shared, callback) {
	if (!this._outstandingCount) {
		/* no locks are currently out there, so just give it out */
		this._sharedMode = shared;
		this._outstandingCount++;
		callback(this.lockRelease.bind(this));
	} else {
		if (this._sharedMode && shared && !this._queue.length) {
			/*
			 * all outstanding locks are shared, as is this one, and no
			 * exclusive lock requests are waiting, so just give it out
			 */
			this._outstandingCount++;
			callback(this.lockRelease.bind(this));
		} else {
			/* there's an exclusive lock somewhere in the picture */
			callback.shared = shared;
			this._queue.push(callback);
		}
	}
};

ReentrantLock.prototype.lockRelease = function() {
	this._outstandingCount--;
	if (this._outstandingCount) {
		/* there are more shared locks to be returned before considering handing out new ones */
		return;
	}

	if (!this._queue.length) {
		/* nobody else waiting for a lock */
		return;
	}

	this._sharedMode = this._queue[0].shared;
	if (!this._sharedMode) {
		this._outstandingCount++;
		var callback = this._queue.shift();
		callback(this.lockRelease.bind(this));
	} else {
		while (this._queue.length && this._queue[0].shared) {
			this._outstandingCount++;
			var callback = this._queue.shift();
			callback(this.lockRelease.bind(this));
		}
	}
};

var FileLocker = function(pathname) {
	this._counter = 0;
	this._fd;
	this._lock = new ReentrantLock();
	this._locking = true;
	this._pathame = pathname;
};

FileLocker.prototype.lock = function(shared, callback) {
	this._lock.lock(shared, function(release) {
		this._acquireLock(shared, function(error) {
			if (error) {
				logger.error("An error occurred while locking file: " + this._pathame, error);
				callback(error);
			} else {
				callback(null, function() {
					this._releaseLock(function() {
						release();
					}.bind(this));
				}.bind(this));
			}
		}.bind(this));
	}.bind(this));
};

FileLocker.prototype._acquireLock = function(shared, callback) {
	if (!this._locking || this._counter) {
		this._counter++;
		callback();
		return;
	}

	fs.open(this._pathame, APPEND, function(err, fd) {
		if (err) {
			callback(err);
		} else {
			fs.flock(fd, shared ? SHARED : EXCLUSIVE, function(err) {
				if (err) {
					callback(err);
				} else {
					this._fd = fd;
					this._counter++;
					callback();
				}
			}.bind(this));
		}
	}.bind(this));
};

FileLocker.prototype._releaseLock = function(callback) {
	if (!--this._counter) {
		if (!this._locking) {
			return;
		}
		if (this._fd) {
			fs.flock(this._fd, UNLOCK, function(err) {
				fs.close(this._fd, function(err) {
					this._fd = null;
					callback();
				}.bind(this));
			}.bind(this));
		}
	}
};

module.exports = FileLocker;
