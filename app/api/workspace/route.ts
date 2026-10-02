import {action,snapshot} from '@/lib/xuelab';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await snapshot());}catch(e){return Response.json({error:(e as Error).message},{status:503});}}
export async function POST(r:Request){try{const origin=r.headers.get('origin');if(origin&&origin!==new URL(r.url).origin)return Response.json({error:'来源不匹配'},{status:403});const x:any=await r.json();return Response.json(await action(x.action,x.args));}catch(e){return Response.json({error:(e as Error).message},{status:400});}}
