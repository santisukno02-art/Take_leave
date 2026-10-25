export async function employeeRequest(pin,action,payload={}) {
 const response=await fetch('/api/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,action,pin}),cache:'no-store'});
 let result;
 try{result=await response.json()}catch{throw new Error('เซิร์ฟเวอร์จัดการพนักงานยังไม่พร้อมใช้งาน')}
 if(!response.ok)throw new Error(result.error||'จัดการพนักงานไม่สำเร็จ');
 return result.data;
}
