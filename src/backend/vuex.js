import { stringify, parse, getLivewireVersion } from "src/util";

export function initVuexBackend(hook, bridge) {
  const store = hook.store;
  let recording = true;
  const livewireVersion = getLivewireVersion();
  // application -> devtool
  const components =
    livewireVersion === 3
      ? hook.Livewire.all()
      : hook.Livewire.components.components();
  components.map((component) => {
    bridge.send("vuex:mutation", {
      checksum: null,
      component: component.id,
      mutation: {
        type:
          (component.name || component.fingerprint.name || "unknown") +
          " - init",
        payload:
          livewireVersion === 3
            ? stringify(component.snapshot.data)
            : stringify(component.data),
      },
      timestamp: Date.now(),
      snapshot: stringify({
        state:
          livewireVersion === 3
            ? stringify(component.snapshot.data)
            : stringify(component.data),
        getters: {},
      }),
    });
  });

  if (livewireVersion === 3) {
    hook.Livewire.hook(
      "commit",
      ({ component, commit, respond, succeed, fail }) => {
        succeed(({ snapshot, effect }) => {
          if (!recording) return;
          console.log(snapshot);
          bridge.send("vuex:mutation", {
            checksum: snapshot.checksum,
            component: component.id,
            mutation: {
              type: component.name,
              payload: stringify(snapshot),
            },
            timestamp: Date.now(),
            snapshot: stringify({
              state: snapshot.data,
              getters: {},
            }),
          });
        });
      }
    );
  } else {
    const livewireHook = hook.Livewire.components.hooks.availableHooks.includes(
      "responseReceived"
    )
      ? "responseReceived"
      : "message.received";
    if (livewireHook === "message.received") {
      hook.Livewire.hook(livewireHook, (message, component) => {
        if (!recording) return;
        const payload = message.response;
        console.log(payload);
        bridge.send("vuex:mutation", {
          checksum: payload.checksum || payload.serverMemo.checksum,
          component: component.id,
          mutation: {
            type: component.name || component.fingerprint.name,
            payload: stringify(payload),
          },
          timestamp: Date.now(),
          snapshot: stringify({
            state: component.data,
            getters: {},
          }),
        });
      });
    } else {
      hook.Livewire.hook(livewireHook, (component, payload) => {
        if (!recording) return;
        bridge.send("vuex:mutation", {
          checksum: payload.checksum || payload.serverMemo.checksum,
          component: component.id,
          mutation: {
            type: component.name || component.fingerprint.name,
            payload: stringify(payload),
          },
          timestamp: Date.now(),
          snapshot: stringify({
            state: component.data,
            getters: {},
          }),
        });
      });
    }
  }

  // devtool -> application
  bridge.on("vuex:travel-to-state", (state) => {
    hook.emit("vuex:travel-to-state", parse(state, true));
  });

  bridge.on("vuex:import-state", (state) => {
    // hook.emit('vuex:travel-to-state', parse(state, true))
    // bridge.send('vuex:init', getSnapshot())
  });

  bridge.on("vuex:toggle-recording", (enabled) => {
    recording = enabled;
  });
}

export function getCustomStoreDetails(store) {
  return {
    _custom: {
      type: "store",
      display: "Store",
      value: {
        state: store.state,
        getters: store.getters,
      },
      fields: {
        abstract: true,
      },
    },
  };
}
