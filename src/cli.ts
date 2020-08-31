import { initREPL, runREPL } from './repl';

const _readline = require('readline').createInterface(process.stdin, process.stdout);
console.log('tinka repl');
process.stdin.setEncoding('utf8');
function _input() {
  _readline.question('> ', function(_i: string) {
    runREPL(_i, (s: string, e?: boolean) => {
      console.log(s);
      setImmediate(_input, 0);
    });
  });
};
initREPL(err => {
  if (err) {
    console.log(err);
    return;
  }
  _input();
});
