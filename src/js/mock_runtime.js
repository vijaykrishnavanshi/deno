// A simple runtime that doesn't involve typescript or protobufs to test
// libdeno. Invoked by mock_runtime_test.cc

const global = this;

function assert(cond) {
  if (!cond) throw Error("mock_runtime.js assert failed");
}

global.typedArrayToArrayBuffer = ta => {
  return ta.buffer.slice(ta.byteOffset, ta.byteOffset + ta.byteLength);
};

global.CanCallFunction = () => {
  deno.print("Hello world from foo");
  return "foo";
};

// This object is created to test snapshotting.
// See DeserializeInternalFieldsCallback and SerializeInternalFieldsCallback.
const snapshotted = new Uint8Array([1, 3, 3, 7]);

global.TypedArraySnapshots = () => {
  assert(snapshotted[0] === 1);
  assert(snapshotted[1] === 3);
  assert(snapshotted[2] === 3);
  assert(snapshotted[3] === 7);
};

global.PubSuccess = () => {
  deno.sub((channel, msg) => {
    assert(channel === "PubSuccess");
    deno.print("PubSuccess: ok");
  });
};

global.PubByteLength = () => {
  deno.sub((channel, msg) => {
    assert(channel === "PubByteLength");
    assert(msg instanceof ArrayBuffer);
    assert(msg.byteLength === 3);
  });
};

global.SubReturnEmpty = () => {
  const ui8 = new Uint8Array("abc".split("").map(c => c.charCodeAt(0)));
  const ab = typedArrayToArrayBuffer(ui8);
  let r = deno.pub("SubReturnEmpty", ab);
  assert(r == null);
  r = deno.pub("SubReturnEmpty", ab);
  assert(r == null);
};

global.SubReturnBar = () => {
  const ui8 = new Uint8Array("abc".split("").map(c => c.charCodeAt(0)));
  const ab = typedArrayToArrayBuffer(ui8);
  const r = deno.pub("SubReturnBar", ab);
  assert(r instanceof ArrayBuffer);
  assert(r.byteLength === 3);
  const rui8 = new Uint8Array(r);
  const rstr = String.fromCharCode(...rui8);
  assert(rstr === "bar");
};

global.DoubleSubFails = () => {
  // deno.sub is an internal function and should only be called once from the
  // runtime.
  deno.sub((channel, msg) => assert(false));
  deno.sub((channel, msg) => assert(false));
};

// The following join has caused SnapshotBug to segfault when using kKeep.
[].join("");

global.SnapshotBug = () => {
  assert("1,2,3" === String([1, 2, 3]));
};

global.ErrorHandling = () => {
  global.onerror = (message, source, line, col, error) => {
    assert("Error: xxx" === message);
    assert("../../js/mock_runtime.js" === source);
    deno.print(`line ${line} col ${col}`);
    assert(line === 89);
    assert(col === 8);
    assert(error instanceof Error);
    deno.pub("ErrorHandling", typedArrayToArrayBuffer(new Uint8Array([42])));
  };
  throw Error("xxx");
};
