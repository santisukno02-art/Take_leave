import {timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'})}
 const pin=process.env.ADMIN_PIN, url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!pin||pin.length<8||!url||!key)return res.status(503).json({error:'ผู้ดูแลยังไม่ได้ตั้งค่ารหัส Admin และการเชื่อมต่อฐานข้อมูลฝั่งเซิร์ฟเวอร์'});
 if(!req.headers?.['content-type']?.startsWith('application/json'))return res.status(415).json({error:'Unsupported content type'});
 const body=req.body;
 if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({error:'ข้อมูลไม่ถูกต้อง'});
 const supplied=typeof body.pin==='string'&&body.pin.length<=64?body.pin:'';
 const actual=Buffer.from(pin),candidate=Buffer.from(supplied);
 if(candidate.length!==actual.length||!timingSafeEqual(candidate,actual))return res.status(401).json({error:'PIN ไม่ถูกต้อง'});
 const allowed=['login','list','create','update','delete'];
 if(!allowed.includes(body.action))return res.status(400).json({error:'คำสั่งไม่ถูกต้อง'});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try {
  if(body.action==='login'||body.action==='list') {
   const {data,error}=await db.from('employees').select('*').order('name');
   if(error)throw error;
   return res.status(200).json({data});
  }
  const {action,id,name,active}=body;
  if(action!=='create'&&(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))return res.status(400).json({error:'รหัสพนักงานไม่ถูกต้อง'});
  if(action==='create'&&(typeof name!=='string'||!name.trim()||name.trim().length>200))return res.status(400).json({error:'กรุณากรอกชื่อพนักงานไม่เกิน 200 ตัวอักษร'});
  const payload={};
  if(name!==undefined){if(typeof name!=='string'||!name.trim()||name.trim().length>200)return res.status(400).json({error:'ชื่อพนักงานไม่ถูกต้อง'});payload.name=name.trim()}
  if(active!==undefined){if(typeof active!=='boolean')return res.status(400).json({error:'สถานะไม่ถูกต้อง'});payload.active=active}
  if(action==='update'&&!Object.keys(payload).length)return res.status(400).json({error:'ไม่มีข้อมูลแก้ไข'});
  const query=action==='create'?db.from('employees').insert({name:name.trim()}):action==='update'?db.from('employees').update(payload).eq('id',id):db.from('employees').delete().eq('id',id);
  const {data,error}=await query.select('id');
  if(error)throw error;
  if(!data?.length)return res.status(404).json({error:'ไม่พบพนักงาน อาจถูกลบไปแล้ว กรุณารีเฟรช'});
  return res.status(200).json({data});
 }catch(error){
  if(error.code==='23503')return res.status(409).json({error:'ลบไม่ได้ เพราะมีประวัติการลา กรุณาปิดใช้งานแทน'});
  console.error('Employee operation failed',{code:error.code});
  return res.status(500).json({error:'จัดการพนักงานไม่สำเร็จ กรุณาลองอีกครั้ง'});
 }
}
