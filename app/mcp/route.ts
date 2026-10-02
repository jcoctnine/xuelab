import {action} from '@/lib/xuelab';
export const dynamic='force-dynamic';
const schema=(properties:any={},required:string[]=[])=>({type:'object',properties,required,additionalProperties:false});
const st={type:'string'};const id={id:st};
const specs=[
 ['get_workspace','读取论文动态、早报、研究设置与收藏/待处理任务',schema(),true],
 ['get_paper','读取指定论文、全文PDF入口、精读报告与稿件状态',schema(id,['id']),true],
 ['refresh_sources','从Crossref检索近30天候选并持久保存；不自动生成精选早报',schema(),false],
 ['ingest_papers','保存经核实论文和中文新闻。提供id/doi,title,url,date,journal,team,topic,citations(null或数字),citationSource/Url/Date,news,limitation,code/codeUrl,evidence,curated。禁止编造引用/全文阅读',schema({papers:{type:'array',items:{type:'object'}}},['papers']),false],
 ['set_saved','收藏或取消收藏',schema({...id,saved:{type:'boolean'}},['id','saved']),false],
 ['request_reading','把论文加入精读待办。需要通过原文全文或用户PDF实际阅读后再提交报告；不得把请求当完成',schema(id,['id']),false],
 ['complete_reading','仅在实际读到全文后写入来源可核查的精读报告；不得自动批准推文',schema({...id,markdown:st,evidence:{type:'string',enum:['full_text','uploaded_pdf']},sources:{type:'array',items:st}},['id','markdown','evidence','sources']),false],
 ['report_reading_blocker','记录拿不到全文等阻碍，提示上传PDF',schema({...id,message:st},['id','message']),false],
 ['approve_article','仅当用户明确看完精读并同意制作推文后调用，收藏/请求精读不构成同意',schema({...id,confirm:{type:'boolean',const:true}},['id','confirm']),false],
 ['complete_article','保存已获用户批准的Markdown稿件；包括图位置、图注、来源及证据局限，不自动发布',schema({...id,markdown:st},['id','markdown']),false],
 ['save_note','保存论文笔记',schema({...id,note:st},['id','note']),false],
 ['save_settings','按用户指示更新研究方向与检索词',schema({topics:{type:'array',items:{type:'object',properties:{name:st,query:st},required:['name','query']}}},['topics']),false],
 ['set_schedule_status','仅在调度工具确认后更新页面的实际更新计划状态',schema({status:st},['status']),false]
] as const;
export async function POST(r:Request){let q:any;try{q=await r.json();if(q.method==='notifications/initialized')return new Response(null,{status:202});let result:any;if(q.method==='initialize')result={protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'xuelab',version:'1.0.0'}};else if(q.method==='ping')result={};else if(q.method==='tools/list')result={tools:specs.map(([name,description,inputSchema,ro])=>({name,description,inputSchema,annotations:{readOnlyHint:ro,destructiveHint:false,openWorldHint:!ro}}))};else if(q.method==='tools/call'){if(!specs.some(s=>s[0]===q.params?.name))throw new Error('Unknown tool');const data=await action(q.params.name,q.params.arguments||{});result={content:[{type:'text',text:JSON.stringify(data)}]};}else return Response.json({jsonrpc:'2.0',id:q.id??null,error:{code:-32601,message:'Method not found'}});return Response.json({jsonrpc:'2.0',id:q.id,result});}catch(e){return Response.json({jsonrpc:'2.0',id:q?.id??null,error:{code:-32602,message:(e as Error).message}});}}
export async function GET(){return new Response('Use POST',{status:405});}
