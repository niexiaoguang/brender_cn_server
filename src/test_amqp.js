
const test = () => {
    console.log('test amqp');
    var amqp = require('amqplib');

    amqp.connect('amqp://user1:pass1@182.92.200.86:5672').then(function(conn) {
      return conn.createChannel().then(function(ch) {
        var q = 'hello';
        var msg = 'Hello World!';
    
        var ok = ch.assertQueue(q, {durable: false});
    
        return ok.then(function(_qok) {
          // NB: `sentToQueue` and `publish` both return a boolean
          // indicating whether it's OK to send again straight away, or
          // (when `false`) that you should wait for the event `'drain'`
          // to fire before writing again. We're just doing the one write,
          // so we'll ignore it.
          ch.sendToQueue(q, Buffer.from(msg));
          console.log(" [x] Sent '%s'", msg);
          return ch.close();
        });
      }).finally(function() { conn.close(); });
    }).catch(console.warn);

    amqp.connect('amqp://user1:pass1@182.92.200.86:5672').then(function(conn) {
        process.once('SIGINT', function() { conn.close(); });
        return conn.createChannel().then(function(ch) {

        var ok = ch.assertQueue('hello', {durable: false});

        ok = ok.then(function(_qok) {
            return ch.consume('hello', function(msg) {
            console.log(" [x] Received '%s'", msg.content.toString());
            }, {noAck: true});
        });

        return ok.then(function(_consumeOk) {
            console.log(' [*] Waiting for messages. To exit press CTRL+C');
        });
        });
    }).catch(console.warn);
}

exports.test = test;