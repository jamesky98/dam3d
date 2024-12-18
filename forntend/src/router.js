import { createMemoryHistory, createRouter } from 'vue-router'

import cesiumView from './components/cesiumView.vue'
import logInView from './components/logInView.vue'
import userSetting from './components/userSetting.vue'

const routes = [
  { path: '/', component: cesiumView },
  { path: '/logIn', component: logInView },
  { path: '/userSetting', component: userSetting },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router