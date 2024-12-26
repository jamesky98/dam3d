import gql from "graphql-tag";

const CHECKTOKEN = gql`
  mutation CheckToken {
    checktoken
  }
`;

const LOGINMU = gql`
  mutation Login($username: String!, $userpassword: String!) {
    login(user_name: $username, user_password: $userpassword) {
      token
      user {
        user_id
        user_name
        active
        role
        user_name2
      }
    }
  }
`;

const GETALLUSERs = gql`
  mutation Allusers {
    allusers {
      user_id
      user_name
      user_mail
      user_password
      active
      role
      user_name2
      user_updated_time
    }
  }
`;

const GETUSER = gql`
  mutation getUserById($userId: Int!) {
    getUserById(user_id: $userId) {
      user_id
      user_name
      user_mail
      user_password
      active
      role
      user_name2
    }
  }
`;

const GETUSERBYNAME = gql`
  mutation GetUserByName($userName: String) {
    getUserByName(user_name: $userName) {
      user_id
      user_name
      user_mail
      user_password
      active
      role
      user_name2
    }
  }
`;


const CHKUSERBYNAME = gql`
  mutation ChkUserByName($userName: String) {
    chkUserByName(user_name: $userName) {
      user_name
    }
  }
`;

const SIGNUPMU = gql`
  mutation Login(
    $userName: String!
    $userPassword: String!
    $userMail: String!
    $userName2: String!
  ) {
    signup(
      user_name: $userName
      user_password: $userPassword
      user_mail: $userMail
      user_name2: $userName2
    ) {
      token
      user {
        user_id
        user_name
        active
        role
        user_name2
      }
    }
  }
`;

const UPDATEUSER = gql`
  mutation UpdateUser(
    $userId: Int!
    $userName2: String
    $userPassword: String
    $userMail: String
    $active: Int
    $role: Int
  ) {
    updateUser(
      user_id: $userId
      user_name2: $userName2
      user_password: $userPassword
      user_mail: $userMail
      active:$active
      role:$role
    ) {
      user_id
      user_name
      user_mail
      user_password
      active
      role
      user_name2
    }
  }
`;

const CHANGEPASSWORD = gql`
  mutation ChangePASSWord(
    $userId: Int!
    $oldpass: String!
    $newpass: String!
    $chkpass: String!
    $enforce: Boolean
  ) {
    changePASSWord(
      user_id: $userId
      oldpass: $oldpass
      newpass: $newpass
      chkpass: $chkpass
      enforce: $enforce)
  }
`;

const GETNOWUSER = gql`
  query GetNowUser {
    getNowUser {
      user_id
      user_name
      user_mail
      user_password
      active
      role
      user_name2
    }
  }
`;

const DELUSER = gql`
  mutation DelUser($userId: Int!) {
    delUser(user_id: $userId) {
      user_id
    }
  }
`;

export default {
  CHECKTOKEN,
  LOGINMU,
  GETUSER,
  GETUSERBYNAME,
  CHKUSERBYNAME,
  GETALLUSERs,
  SIGNUPMU,
  UPDATEUSER,
  CHANGEPASSWORD,
  GETNOWUSER,
  DELUSER,
};
