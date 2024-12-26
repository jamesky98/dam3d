import { createWebHistory, createMemoryHistory, createRouter } from 'vue-router'
createWebHistory
import cesiumView from './components/cesiumView.vue'
import logInView from './components/logInView.vue'
import userSetting from './components/userSetting.vue'

const routes = [
  { path: '/', component: cesiumView },
  { path: '/logIn', component: logInView },
  { path: '/userSetting', component: userSetting },
]

const router = createRouter({
  history: createWebHistory(),//createMemoryHistory(),
  routes,
})

export default router