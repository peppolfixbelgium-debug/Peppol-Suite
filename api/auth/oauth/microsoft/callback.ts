import { callbackOAuth } from "../../../_lib/oauth";
export default async function handler(request:Request){try{return await callbackOAuth(request,"microsoft");}catch{return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});}}
