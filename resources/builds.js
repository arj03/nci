'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	db = require('../db'),
	utils = require('../lib/utils');

module.exports = function(app) {
	var resource = app.dataio.resource('builds');

	resource.use('readAll', function(req, res, next) {
		Steppy(
			function() {
				var data = req.data || {};

				var start = {};
				if (data.projectName) {
					start.projectName = data.projectName;
				}

				start.descCreateDate = data.descCreateDate || '';

				var findParams = _(data).pick('offset', 'limit');
				findParams.start = start;
				findParams.limit = findParams.limit || 20;

				db.builds.find(findParams, this.slot());
			},
			function(err, builds) {
				// omit big fields not needed for list
				_(builds).each(function(build) {
					delete build.stepTimings;
					if (build.scm) {
						delete build.scm.changes;
					}
					build.project = _(build.project).pick(
						'name', 'scm', 'avgBuildDuration'
					);
				});

				res.send(builds);
			},
			next
		);
	});

	resource.use('read', function(req, res, next) {
		Steppy(
			function() {
				var findParams = {};
				findParams.start = _(req.data).pick('id');
				db.builds.find(findParams, this.slot());
			},
			function(err, build) {
				res.send(build[0]);
			},
			next
		);
	});

	resource.use('getBuildLogTail', function(req, res, next) {
		Steppy(
			function() {
				var findParams = {
					reverse: true,
					start: {buildId: req.data.buildId, numberStr: ''},
					limit: req.data.length
				};

				db.logLines.find(findParams, this.slot());
			},
			function(err, logLines) {
				var lines = _(logLines).pluck('text').reverse(),
					total = logLines.length ? logLines[0].number : 0;

				res.send({lines: lines, total: total});
			},
			next
		);
	});

	resource.use('getBuildLogLines', function(req, res, next) {
		Steppy(
			function() {
				var buildId = req.data.buildId,
					from = req.data.from,
					to = req.data.to;

				db.logLines.find({
					start: {buildId: buildId, numberStr: utils.toNumberStr(from)},
					end: {buildId: buildId, numberStr: utils.toNumberStr(to)}
				}, this.slot());
			},
			function(err, logLines) {
				res.send({
					lines: _(logLines).pluck('text')
				});
			},
			next
		);
	});

	return resource;
};
