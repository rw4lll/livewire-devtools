import { stringify, getLivewireComponentById, getLivewireVersion } from '../util'
// import { getInstanceName } from './index'

export function initEventsBackend (Livewire, bridge) {
  let recording = true
  const livewireVersion = getLivewireVersion();

  bridge.on('events:toggle-recording', enabled => {
    recording = enabled
  })

  function logEvent (Livewire, type, instance, eventName, payload) {
    // The string check is important for compat with 1.x where the first
    // argument may be an object instead of a string.
    // this also ensures the event is only logged for direct $emit (source)
    // instead of by $dispatch/$broadcast
    if (typeof eventName === 'string') {
      let instanceId
      let instanceName = 'unknown'

      if (instance !== null) {
        instanceId = instance.id || instance.el.getAttribute("wire:id")
        const component = getLivewireComponentById(instanceId, Livewire)
        instanceName = component.name || component.fingerprint.name || "unknown"
      }

      bridge.send('event:triggered', stringify({
        eventName,
        type,
        payload,
        instanceId,
        instanceName,
        timestamp: Date.now()
      }))
    }
  }

  function wrapEmit () {
    if (livewireVersion === 3) {
      const original = Livewire.dispatch
      Livewire.dispatch = function (...args) {
        const res = original.apply(this, args)
        if (recording) {
          logEvent(Livewire, "dispatch", args[0], args[1], args[2])
        }
        return res
      }
    } else {
      const original = Livewire.components.emit
      Livewire.components.emit = function (...args) {
        const res = original.apply(this, args)
        if (recording) {
          logEvent(Livewire, 'emit', null, args[0], args.slice(1))
        }
        return res
      }
    }
  }

  wrapEmit()
  // wrap('emitUp')
  // wrap('emitSelf')
  // wrap('$broadcast')
  // wrap('$dispatch')
}
