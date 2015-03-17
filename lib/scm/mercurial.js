'use strict';

var ParentScm = require('./base').Scm,
	inherits = require('util').inherits;

function Scm(params) {
	ParentScm.call(this, params);
}

exports.Scm = Scm;

inherits(Scm, ParentScm);

Scm.prototype.defaultRev = 'default';

Scm.prototype.clone = function(dst, rev, callback) {
	var self = this;
	this.run({
		cmd: 'hg',
		args: ['clone', '--rev', rev, this.repository, dst]
	}, function(err) {
		self.cwd = dst;
		callback(err);
	});
};

Scm.prototype.pull = function(rev, callback) {
	this.run({cmd: 'hg', args: ['pull', '--rev', rev]}, callback);
};

Scm.prototype.getId = function(callback) {
	this.run({cmd: 'hg', args: ['id', '--id']}, function(err, stdout) {
		callback(err, !err && stdout.replace('\n', ''));
	});
};

Scm.prototype.getChanges = function(rev1, rev2, callback) {
	this.run({cmd: 'hg', args: [
		'log', '--rev', rev2 + ':' + rev1,
		'--template', '{node|short};;;{author};;;{date|date};;;{desc}\n'
	]}, function(err, stdout) {
		callback(err, !err &&  stdout.split('\n').slice(0, -2).map(function(str) {
			var parts = str.split(';;;');
			return {
				id: parts[0],
				author: parts[1],
				date: new Date(parts[2]).getTime(),
				comment: parts[3]
			};
		}));
	});
};

Scm.prototype.update = function(rev, callback) {
	this.run({cmd: 'hg', args: ['up', rev]}, callback);
};