import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app'),
})

// Ask the browser not to clear our database when the phone is low on space.
// (Installed home-screen apps on iOS already get this; this covers other cases.)
navigator.storage?.persist?.()

export default app
