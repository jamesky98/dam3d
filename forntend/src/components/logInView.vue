<script setup>
import slogan from "../components/Slogan.vue";
import { useMutation } from '@vue/apollo-composable';
import UsersGQL from "../graphql/Users";
import { ref } from 'vue';
import router from '../router'
import { MDBCard, 
  MDBCardBody, 
  MDBInput, 
  MDBCol, 
  MDBRow, 
  MDBContainer, 
  MDBBtn,
  MDBAlert
} from 'mdb-vue-ui-kit';
import { errorHandle, logIn, logOut, toTWDate } from '../methods/User';



// 傳遞參數
const version = ref(import.meta.env.VITE_VERSION);
const user_name = ref('');
const user_password = ref('');
const token = ref('');

const alert1 = ref(false);
const infomsg = ref("");
const alertColor = ref("primary");

// // 執行查詢
const { mutate: userlogin, onDone: loginOnDone, onError:loginError } = useMutation(
  UsersGQL.LOGINMU,
  () => (
    {
      variables: {
        username: user_name.value,
        userpassword: user_password.value
      }
    }),
);

loginOnDone(result => {
  if (!result.loading && result.data.login) {
    // console.log(result)
    logIn(result);
  }
});

loginError(e => {
  errorHandle(e,infomsg,alert1);
  localStorage.removeItem("AUTH_TOKEN");
  localStorage.removeItem("USER_ID");
  localStorage.removeItem("USER_NAME");
  localStorage.removeItem("USER_NAME2");
  localStorage.removeItem("USER_ROLE");
  localStorage.removeItem("USER_AC");
});

</script>

<template>
  <MDBAlert v-model="alert1" id="alert-primary" :color="alertColor" position="top-right" stacking width="535px"
    autohide :delay="2000.0">
    {{ infomsg }}
  </MDBAlert>
  <section class="h-100 gradient-form" style="background-color: #eee;">
    <MDBContainer class="py-5 h-100">
      <MDBRow class="d-flex justify-content-center align-items-center h-100">
        <MDBCol xl="10">
          <MDBCard class="rounded-3 text-black">
            <MDBRow class="g-0">
              <MDBCol lg="6">
                <MDBCardBody class="p-md-5 mx-md-4">
                  <div class="text-center">
                    <a href="" target="_blank"><img src="/nosrc.png" style="width: 185px;" alt="logo"></a>
                    <h4 class="mt-1 mb-5 pb-1">使用者管理系統</h4>
                  </div>
                  <form @submit.prevent="userlogin()">
                    <p>請登入帳號</p>
                    <div class="form-outline mb-4">
                      <MDBInput required type="text" label="員工編號" id="form2Example11" v-model="user_name"
                        wrapperClass="mb-4" />
                    </div>
                    <div class="form-outline mb-4">
                      <MDBInput required type="password" label="密碼" id="form2Example22" v-model="user_password"
                        wrapperClass="mb-4" />
                    </div>
                    <div class="text-center pt-1 mb-5 pb-1">
                      <MDBBtn color="primary" block class="fs-6 gradient-custom-2 col-12" type="submit">登入
                      </MDBBtn>
                      <MDBBtn color="primary" block class="fs-6 gradient-custom-2 col-12" @click="logOut">回主頁
                      </MDBBtn>
                    </div>

                    <!-- <div class="d-flex align-items-center justify-content-center pb-4">
                      <p class="mb-0 me-2">還沒有帳號?</p>
                      <MDBBtn outline="danger" @click="router.push('/signup')">這裡註冊</MDBBtn>
                    </div> -->

                  </form>
                </MDBCardBody>
              </MDBCol>

              <MDBCol lg="6" class="d-flex align-items-center gradient-custom-2">
                <slogan></slogan>
                <div style="position:absolute; right: 0.5rem;bottom: 0.5rem; ">{{version}}</div>
              </MDBCol>
              

            </MDBRow>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  </section>
</template>
<style>
.gradient-custom-2 {
  /* fallback for old browsers */
  background: #fccb90;

  /* Chrome 10-25, Safari 5.1-6 */
  background: -webkit-linear-gradient(to right, #0078AA, #3AB4F2,#F2DF3A);

  /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
  background: linear-gradient(to right, #79DAE8,
    #0AA1DD,
    #2155CD);
}

@media (min-width: 768px) {
  .gradient-form {
    height: 100vh !important;
  }
}

@media (min-width: 769px) {
  .gradient-custom-2 {
    border-top-right-radius: .3rem;
    border-bottom-right-radius: .3rem;
  }
}
</style>

