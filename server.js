var config = require('./config.json'),
    io = require('socket.io').listen(config.port),
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    winston = require('winston'),
    absrel = require('./app/absrel/absrel.js'),
    busted = require('./app/busted/busted.js'),
    fade = require('./app/fade/fade.js'),
    fel = require('./app/fel/fel.js'),
    flea = require('./app/flea/flea.js'),
    fubar = require('./app/fubar/fubar.js'),
    gard = require('./app/gard/gard.js'),
    hivtrace = require('./app/hivtrace/hivtrace.js'),
    meme = require('./app/meme/meme.js'),
    prime = require('./app/prime/prime.js'),
    relax = require('./app/relax/relax.js'),
    slac = require('./app/slac/slac.js'),
    job = require('./app/job.js'),
    ss = require('socket.io-stream'),
    redis   = require('redis'),
    router = require(path.join(__dirname, '/lib/router.js')),
    JobQueue = require(path.join(__dirname, '/lib/jobqueue.js')).JobQueue;

winston.level = config.loglevel;

var client = redis.createClient();

// clear active_jobs list 
// TODO: we should do more than just clear the active_jobs list
client.del('active_jobs');

// For every new connection...
io.sockets.on('connection', function (socket) {

  //Routes 
  socket.on('job queue', function (jobs) {
    JobQueue(function(jobs) {
      socket.emit('job queue', jobs);
    });
  });

  var r =  new router.io(socket);

  // HIV-TRACE
  r.route('hivtrace', {

    spawn : function (stream, params) {
      var hivtrace_job = new hivtrace.hivtrace(socket, stream, params.job.analysis);
    },

    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    }

  });

  // FLEA
  r.route('flea', {
    spawn : function (stream, params) {
      var flea_job = new flea.flea(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    }
  });

  // PRIME
  // TODO: Currently broken and route is commented out
  r.route('prime', {
    spawn : function (stream, params) {
      var prime_job = new prime.prime(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, id);
    },
    cancel : function(params) {
      new job.cancel(socket, id);
    }
  });

  // BUSTED
  r.route('busted', {

    spawn : function (stream, params) {
      var busted_job = new busted.busted(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id); 
    },
    cancel : function(params) {
      new job.cancel(socket, params.id); 
    }

  });

  // RELAX
  r.route('relax', {

    spawn : function (stream, params) {
      var relax_job = new relax.relax(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });

  // FADE
  r.route('fade', {

    spawn : function (stream, params) {
      var fade_job = new fade.fade(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });

  // FEL
  r.route('fel', {

    spawn : function (stream, params) {
      var fel_job = new fel.fel(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });


  // aBSREL
  r.route('absrel', {

    spawn : function (stream, params) {
      new absrel.absrel(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });

  // MEME
  r.route('meme', {

    spawn : function (stream, params) {
      new meme.meme(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });

  // SLAC
  r.route('slac', {

    spawn : function (stream, params) {
      new slac.slac(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });

  // GARD 
  r.route('gard', {

    spawn : function (stream, params) {
      new gard.gard(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });

  // FUBAR
  r.route('fubar', {

    spawn : function (stream, params) {
      new fubar.fubar(socket, stream, params.job);
    },
    resubscribe : function(params) {
      new job.resubscribe(socket, params.id);
    },
    cancel : function(params) {
      new job.cancel(socket, params.id);
    }

  });

  // Acknowledge new connection
  socket.emit('connected', { hello: 'Ready to serve' });

});

process.setMaxListeners(0);
