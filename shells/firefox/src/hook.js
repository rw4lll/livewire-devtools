// This script is injected into every page.
import { installHook } from 'src/backend/hook'

// inject the hook
if (document instanceof Document) {
  const source = ';(' + installHook.toString() + ')(window)'
  // eslint-disable-next-line no-eval
  window.eval(source) // in Firefox, this evaluates on the content window
}
