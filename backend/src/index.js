/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */

// apollo server
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';

import express from "express";
import cors from "cors";
import http from "http";
import bodyParser from 'body-parser';

// file and path
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// graphql and prisma
import { typeDefs as scalarTypeDefs } from "graphql-scalars";
import { PrismaClient } from "@prisma/client";

// graphql-upload
import GraphQLUpload from "../node_modules/graphql-upload/GraphQLUpload.mjs";
import graphqlUploadExpress from "../node_modules/graphql-upload/graphqlUploadExpress.mjs";

// utiles
import { getUserId } from "./utils.js";
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

// resolvers
import Query from "./resolvers/Query.js";
import Mutation from "./resolvers/Mutation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const envfile = (process.env.NODE_ENV==='development')?'development.env':'.env'
const envfile = '.env'

let myEnv = dotenv.config({
  path: path.resolve(process.cwd(), envfile),
  override: true
});
dotenvExpand.expand(myEnv);

// console.log('env:',process.env);
console.log('envfile:',envfile);
console.log('mode:',process.env.NODE_ENV);
console.log('IP:',process.env.IP);
console.log('DATABASE_URL:',process.env.DETABASE_IP);
console.log("WorkPath: ", __dirname);

// get Resolvers
const resolvers = {
  Query,
  Mutation,
  Upload: GraphQLUpload,
};

const prisma = new PrismaClient();

const typeDefs = [
  ...scalarTypeDefs,
  fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
];

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    // 與Express server集成
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // 設定初始頁面為Apollo Sandbox
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    // 取消初始頁面為Apollo Sandbox
    // ApolloServerPluginLandingPageDisabled(),
  ],
});

await server.start();

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,POST,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}


app.use('/',
  cors(corsOptions),
  bodyParser.json(),
  expressMiddleware(server, {
    context: async  ({ req }) => {
      return {
        ...req,
        prisma,
        userId: req && req.headers.authorization ? getUserId(req) : null,
      };
    },
  }),
);

await new Promise(resolve => httpServer.listen({ port: process.env.PORT }, resolve));
console.log(`🚀 Server ready at http://${process.env.IP}:${process.env.PORT}`);