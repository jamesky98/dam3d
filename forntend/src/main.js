import { createApp } from 'vue'
import router from './router'
import './style.css'
import App from './App.vue'
import 'mdb-vue-ui-kit/css/mdb.min.css';

createApp(App)
  .use(router)
  .mount('#app')
