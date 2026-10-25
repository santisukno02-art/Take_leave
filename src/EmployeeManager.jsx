import React, {useEffect, useRef, useState} from 'react';
import {Plus, Pencil, Trash2, X, Users} from 'lucide-react';

function errorMessage(error) {
 if(error.code==='42501') return 'ฐานข้อมูลยังไม่อนุญาตให้จัดการพนักงาน กรุณาให้ผู้ดูแลตั้งค่าสิทธิ์ employees ใน Supabase';
 if(error.code==='23503') return 'ลบไม่ได้ เพราะพนักงานมีประวัติการลา กรุณาปิดใช้งานเพื่อเก็บประวัติเดิม';
 return error.message || 'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง';
}

export default function EmployeeManager({request, employees, onChange, onClose}) {
 const dialog=useRef(null);
 const [name,setName]=useState(''),[editing,setEditing]=useState(null),[deleting,setDeleting]=useState(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{const element=dialog.current; element.showModal(); return ()=>element.close()},[]);
 async function mutate(operation, success, reset=()=>{}) {
  if(busy)return;
  setBusy(true);setError('');setNotice('');
  try {
   const data=await operation();
   if(!data?.length)throw {code:'42501'};
   reset();setNotice(success);await onChange();
  } catch(failure){setError(errorMessage(failure))} finally{setBusy(false)}
 }
 function save(event) {
  event.preventDefault();
  const value=name.trim();
  if(!value){setError('กรุณากรอกชื่อพนักงาน');return}
  mutate(()=>request(editing?'update':'create',{...(editing?{id:editing}:{}),name:value}),editing?'แก้ไขชื่อพนักงานแล้ว':'เพิ่มพนักงานแล้ว',()=>{setName('');setEditing(null)});
 }
 function edit(employee){setEditing(employee.id);setName(employee.name);setDeleting(null);setError('');setNotice('');dialog.current.querySelector('input').focus()}
 return <dialog ref={dialog} className="employee-dialog" aria-labelledby="employee-title" onCancel={event=>{if(busy)event.preventDefault();else onClose()}} onClick={event=>{if(event.target===dialog.current&&!busy)onClose()}}>
  <div className="employee-dialog-body">
   <div className="modal-head"><div><h2 id="employee-title"><Users size={20}/> จัดการพนักงาน</h2><p>เพิ่ม แก้ไข ลบ หรือปิดใช้งานรายชื่อ</p></div><button className="icon" aria-label="ปิดหน้าจัดการพนักงาน" disabled={busy} onClick={onClose}><X/></button></div>
   <form className="employee-form" onSubmit={save}>
    <label htmlFor="employee-name">{editing?'แก้ไขชื่อพนักงาน':'ชื่อพนักงานใหม่'}</label>
    <div className="employee-input-row"><input id="employee-name" autoFocus required maxLength={200} value={name} disabled={busy} onChange={event=>setName(event.target.value)} placeholder="กรอกชื่อพนักงาน"/><button className="btn primary" disabled={busy}><Plus size={16}/>{busy?'กำลังบันทึก…':editing?'บันทึกชื่อ':'เพิ่มพนักงาน'}</button>{editing&&<button type="button" className="btn light" disabled={busy} onClick={()=>{setEditing(null);setName('')}}>ยกเลิก</button>}</div>
   </form>
   {error&&<div className="notice error employee-message" role="alert">{error}</div>}
   {notice&&<div className="notice employee-message" role="status">{notice}</div>}
   <div className="employee-list" aria-busy={busy}>
    {employees.length===0?<div className="empty">ยังไม่มีพนักงาน เริ่มเพิ่มชื่อได้ด้านบน</div>:employees.map(employee=><div className="employee-row" key={employee.id}>
     <div className="employee-name"><b>{employee.name}</b><small>{employee.active?'ใช้งาน':'ปิดใช้งาน'}</small></div>
     <div className="employee-buttons"><button className="btn light" disabled={busy} aria-label={`แก้ไข ${employee.name}`} onClick={()=>edit(employee)}><Pencil size={14}/>แก้ไข</button><button className="btn light" disabled={busy} onClick={()=>mutate(()=>request('update',{id:employee.id,active:!employee.active}),'เปลี่ยนสถานะพนักงานแล้ว')}>{employee.active?'ปิดใช้งาน':'เปิดใช้งาน'}</button><button className="btn light danger-btn" disabled={busy} aria-label={`ลบ ${employee.name}`} onClick={()=>{setDeleting(employee.id);setError('');setNotice('')}}><Trash2 size={14}/>ลบ</button></div>
     {deleting===employee.id&&<div className="employee-confirm"><p>ยืนยันลบ “{employee.name}”? หากมีประวัติการลา ให้ปิดใช้งานแทน</p><button className="btn danger-btn light" disabled={busy} onClick={()=>mutate(()=>request('delete',{id:employee.id}),'ลบพนักงานแล้ว',()=>{setDeleting(null);if(editing===employee.id){setEditing(null);setName('')}})}>ยืนยันลบ</button><button className="btn light" disabled={busy} onClick={()=>setDeleting(null)}>ยกเลิก</button></div>}
    </div>)}
   </div>
  </div>
 </dialog>
}
