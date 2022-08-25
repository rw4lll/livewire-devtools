import { installToast } from 'src/backend/toast'

function detect (win) {
  setTimeout(() => {
    if (!win.Livewire) {
      return
    }
    win.postMessage({
      livewireDetected: true,
      devToolsEnabled: win.Livewire.devToolsEnabled || false
    }, '*')

    win.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__.emit('init', win.Livewire)
  }, 100)
}

// inject the hook
if (document instanceof Document) {
  detect(window)
  installToast(window)
}
