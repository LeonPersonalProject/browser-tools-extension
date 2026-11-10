import './jsonCore.js';
self.onmessage = ({ data }) => {
  self.postMessage(globalThis.__candyJsonFormatter.format(data.text, data.indent, data.sort));
};
