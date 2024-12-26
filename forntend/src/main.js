import { createApp, provide, h } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import apolloClient from './apolloclient'
import App from './App.vue'
import router from './router'
import './style.css'
import 'mdb-vue-ui-kit/css/mdb.min.css';

const app = createApp({
  setup() {
    provide(DefaultApolloClient ,apolloClient);
  },
  render: () => h(App),
});

app.use(router)
  .mount('#app')
