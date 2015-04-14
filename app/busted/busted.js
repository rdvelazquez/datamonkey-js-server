/*

  Datamonkey - An API for comparative analysis of sequence alignments using state-of-the-art statistical models.

  Copyright (C) 2015
  Sergei L Kosakovsky Pond (spond@ucsd.edu)
  Steven Weaver (sweaver@ucsd.edu)

  Permission is hereby granted, free of charge, to any person obtaining a
  copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be included
  in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var config  = require('../../config.json'),
    cs      = require('../../lib/clientsocket.js'),
    job     = require('../job.js'),
    redis   = require('redis'),
    winston = require('winston'),
    _       = require('underscore'),
    fs      = require('fs'),
    path    = require('path'),
    ss      = require('socket.io-stream');

winston.level = config.loglevel;

// Use redis as our key-value store
var client = redis.createClient();

var busted = function (socket, stream, busted_params) {

  var self = this;
  self.socket = socket;
  self.stream = stream;
  self.params = busted_params;
  self.fn = __dirname + '/output/' + self.params.analysis._id;
  self.filepath = self.fn;
  self.output_dir  = path.dirname(self.filepath);
  self.qsub_script_name = 'busted_submit.sh';
  self.qsub_script = __dirname + '/' + self.qsub_script_name;
  self.id = busted_params.analysis._id;
  self.msaid = busted_params.msa._id;
  self.status_fn = self.filepath + '.status';
  self.progress_fn = self.filepath + '.BUSTED.progress';
  self.results_fn = self.filepath + '.BUSTED.json';
  self.tree_fn = self.filepath + '.tre';
  self.busted = config.busted;
  self.status_stack = busted_params.status_stack;
  self.genetic_code = "1";
  self.torque_id = "unk";
  self.std_err = "unk";
  self.job_completed = false;

  self.qsub_params =  ['-q',
                          config.qsub_queue,
                          '-v',
                          'fn='+self.filepath+
                          ',tree_fn='+self.tree_fn+
                          ',sfn='+self.status_fn+
                          ',pfn='+self.progress_fn+
                          ',treemode='+self.treemode+
                          ',genetic_code='+self.genetic_code+
                          ',cwd='+__dirname+
                          ',msaid='+self.msaid,
                          '-o', self.output_dir,
                          '-e', self.output_dir, 
                          self.qsub_script];

  // Write tree to a file
  fs.writeFile(self.tree_fn, busted_params.analysis.tagged_nwk_tree, function (err) {
    if (err) throw err;
  });

  // Ensure the progress file exists
  fs.openSync(self.progress_fn, 'w');

  self.spawn();

};

// Pass socket to busted job
busted.prototype.spawn = function () {

  var self = this;

  var push_active_job = function (id) {
        client.rpush('active_jobs', self.id)
      }, 
     push_job_once = _.once(push_active_job);


  winston.log('info', self.id + ' : busted : spawning');

  // Setup Analysis
  var busted_analysis = new job.jobRunner(self.qsub_params);
  var clientSocket = new cs.ClientSocket(self.socket, self.id);  

  // On status updates, report to datamonkey-js
  busted_analysis.on('status', function(status) {
    winston.info(self.id + ' ' + status);
    client.hset(self.id, 'status', status, redis.print);
  });

  // On status updates, report to datamonkey-js
  busted_analysis.on('status update', function(status_update) {
    self.onStatusUpdate();
  });

  // On errors, report to datamonkey-js
  busted_analysis.on('script error', function(error) {
    self.onError();
  });

  // When the analysis completes, return the results to datamonkey.
  busted_analysis.on('completed', function(results) {
    self.onComplete();
  });

  // Report the torque job id back to datamonkey
  busted_analysis.on('job created', function(torque_id) {
    var redis_packet = torque_id;
    redis_packet.type = 'job created';
    str_redis_packet = JSON.stringify(torque_id);
    winston.log('info', self.id + ' : job created : ' + str_redis_packet);
    client.hset(self.id, 'torque_id', str_redis_packet, redis.print);
    client.publish(self.id, str_redis_packet);
    push_job_once(self.id);
  });

  self.stream.pipe(fs.createWriteStream(self.fn));
  self.stream.on('end', function(err) {
    if (err) throw err;
    // Pass filename in as opposed to generating it in spawn_busted
    busted_analysis.submit(self.qsub_params, self.output_dir);
  });

  self.socket.on('disconnect', function () {
    winston.info('user disconnected');
  });

};

busted.prototype.onComplete = function () {

 var self = this;

  fs.readFile(self.results_fn, 'utf8', function (err, data) {
    if(err) {
      self.onError('unable to read results file');
    } else{
      if(data) {
        var redis_packet = { 'results' : data };
        redis_packet.type = 'completed';
        var str_redis_packet = JSON.stringify(redis_packet);
        winston.log('info', self.id + ' : job completed');
        client.hset(self.id, 'results', str_redis_packet, redis.print);
        client.hset(self.id, 'status', 'completed', redis.print);
        client.publish(self.id, str_redis_packet);
        client.lrem('active_jobs', 1, self.id)
      } else {
        self.onError('job seems to have completed, but no results found');
      }
    }
  });

}

busted.prototype.onStatusUpdate = function() {

 var self = this;

 fs.readFile(self.progress_fn, 'utf8', function (err, data) {
   if(err) {
     winston.warn('error reading progress file ' + self.progress_fn + '. error: ' + err);
   } else if (data) {
     self.current_status = data;
     var status_update = {'phase' : 'running', 'index': 1, 'msg': data, 'torque_id' : self.torque_id};
     var redis_packet = status_update;
     redis_packet.type = 'status update';
     str_redis_packet =  JSON.stringify(status_update);
     winston.info(self.id + ' : ' + str_redis_packet);
     client.hset(self.id, 'status update', str_redis_packet, redis.print);
     client.publish(self.id, str_redis_packet);
   } else {
    winston.warn('read progress file, but no data');
   }
 });

}

busted.prototype.onError = function(error) {

  var self = this;

  var redis_packet = {'error' : error };
  redis_packet.type = 'script error';
  str_redis_packet = JSON.stringify(error);
  winston.warn(self.id + ' : ' + str_redis_packet);
  client.hset(self.id, 'error', str_redis_packet, redis.print);
  client.publish(self.id, str_redis_packet);
  client.lrem('active_jobs', 1, self.id)
}

busted.prototype.clearJob = function() {
  var self = this;
}

exports.busted = busted;
