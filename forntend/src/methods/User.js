import router from "../router";

async function errorHandle(e,infomsg,alert1,msgColor){
  console.log('errorHandle',e);
  const res_3 = await new Promise((res, rej) => {

    if(e.message.indexOf('No such user found')!==-1){
      infomsg.value = "查無此帳號";
      alert1.value = true;
    }else if(e.message.indexOf('Invalid password')!==-1){
      infomsg.value = "密碼錯誤";
      alert1.value = true;
    }else if(e.message.indexOf('Not active')!==-1){
      infomsg.value = "帳號尚未啟用";
      alert1.value = true;
    }else if(e.message.indexOf('No token found')!==-1){
      infomsg.value = "未登入";
      // alert1.value = true;
      logOut();
    }else if(e.message.indexOf('Foreign key constraint failed')!==-1){
      infomsg.value = "本資料不可變更，因含有其他連結資料，請刪除連結資料後再試";
      msgColor.value = 'red'
      // alert1.value = true;
    }else if(e.message.indexOf('Token expired')!==-1){
      infomsg.value = "授權過期";
      logOut();
    }
    res(infomsg.value);
  })
  return res_3;
  
}

function logOut() {
  console.log("logOut")
  localStorage.removeItem("DAM3D_AUTH_TOKEN");
  localStorage.removeItem("DAM3D_USER_NAME");
  router.push("/");
}

function logIn(result) {
  let getData = result.data.login;
  if (getData.user.active === 1) {
    localStorage.setItem("DAM3D_AUTH_TOKEN", result.data.login.token);
    localStorage.setItem("DAM3D_USER_NAME", result.data.login.user.user_name);
    // console.log("localStorage In")
    router.push("/userSetting");
  } else {
    logOut();
  }
}

function toTWDate(data) {
  let ttdate = "-";
  if (data) {
    ttdate = data.split("T")[0];
    let dateObj = new Date(ttdate);
    let year = dateObj.getFullYear() - 1911;
    let month =
      dateObj.getMonth() + 1 < 10
        ? "0" + (dateObj.getMonth() + 1)
        : dateObj.getMonth() + 1;
    let date =
      dateObj.getDate() < 10 ? "0" + dateObj.getDate() : dateObj.getDate();
    // console.log(dateObj.getMonth());
    ttdate = year + "/" + month + "/" + date;
  }
  return ttdate;
}

function domTextSelect(e){
  e.target.select()
}


export { 
  errorHandle, 
  logIn, 
  logOut, 
  toTWDate, 
  domTextSelect, 
};
