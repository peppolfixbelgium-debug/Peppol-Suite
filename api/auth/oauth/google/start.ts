import { startOAuth } from "../../../_lib/oauth";
export default async function handler(){try{return await startOAuth("google");}catch{return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});}}
