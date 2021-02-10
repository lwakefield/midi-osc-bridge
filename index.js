#!/usr/bin/env node
const { URL }  = require('url');
const Easymidi = require('easymidi');
const Osc      = require('osc');

let host = process.argv[process.argv.length - 1];

if (!host) {
  proces.stderr.write('usage midi-osc-bridge <hostname>\n');
  process.exit(1);
}

host = new URL(host);

const midi = {
  input: new Easymidi.Input(`${host.hostname} bridge`, true),
  output: new Easymidi.Output(`${host.hostname} bridge`, true),
}

const osc = new Osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 57121,
  remoteAddress: host.hostname,
  remotePort: host.port,
  metadata: true
});

osc.on('message', function (msg, time, info) {
  if (msg.address === '/noteon')  midi.output.send('noteon', {
    note: msg.args[0].value,
    velocity: msg.args[1] && msg.args[1].value || 127,
    channel: msg.args[2] && msg.args[2].value || 0
  })

  if (msg.address === '/noteoff')  midi.output.send('noteoff', {
    note: msg.args[0].value,
    velocity: msg.args[1] && msg.args[1].value || 0,
    channel: msg.args[2] && msg.args[2].value || 0
  })
});
midi.input.on('clock',    () => { osc.send({ address: '/clock'    }) });
midi.input.on('start',    () => { osc.send({ address: '/start'    }) });
midi.input.on('continue', () => { osc.send({ address: '/continue' }) });
midi.input.on('stop',     () => { osc.send({ address: '/stop'     }) });

osc.open();

osc.send({ address: '/hello', args: [{type:'s',value:'world'}] });

process.on('exit', () => {
  midi.input.close();
  midi.output.close();
  osc.close();
});

