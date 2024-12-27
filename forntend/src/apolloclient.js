import {
  ApolloClient, createHttpLink,
  InMemoryCache,
  from,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import { onError } from '@apollo/client/link/error';
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { logOut } from './methods/User';

// 設定認證標頭
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const tokenvalue = localStorage.getItem("DAM3D_AUTH_TOKEN");
  // return the headers to the context so httpLink can read them
  // console.log("tokenvalue",tokenvalue);
  return {
    headers: {
      ...headers,
      authorization: tokenvalue ? `Bearer ${tokenvalue}` : "",
      "Apollo-Require-Preflight": "true",
    },
  };
});

// 設定錯誤處理
const logoutLink = onError(({ graphQLErrors, networkError }) => {
  // if (graphQLErrors){
  //   graphQLErrors.forEach(({ message, locations, path }) => {
  //     console.log(
  //       `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
  //     );
      
  //     if(message.indexOf('Foreign key constraint failed')!==-1){
  //       console.log('有其他連結資料，本資料不可變更')
  //     }else{
  //       // logOut();
  //     }
  //   }
  //   );
  // }
  
  if (networkError){
    console.log(`[Network error]: ${networkError}`);
    if (networkError.statusCode === 401) logOut();
  } 
  
})

// 設定 GraphQL 伺服器的 URL
const httpLink = createUploadLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
});
// 下面是無上傳功能的版本
// const httpLink = createHttpLink({
//   uri: import.meta.env.VITE_GRAPHQL_URL,
// });

// authLink.concat(logoutLink.concat(httpLink)),
const apolloClient = new ApolloClient({
  link: from([logoutLink,authLink,httpLink]),
  cache: new InMemoryCache(),
});

export default apolloClient;
