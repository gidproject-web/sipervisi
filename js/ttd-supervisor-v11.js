(function(){
 function update(){const text=document.getElementById('infoSupervisor')?.textContent?.trim()||'-';if(text==='-'||!text)return;document.querySelectorAll('.v11-supervisor-name').forEach(x=>x.textContent=text);}
 document.addEventListener('DOMContentLoaded',()=>{update();const el=document.getElementById('infoSupervisor');if(el)new MutationObserver(update).observe(el,{childList:true,subtree:true,characterData:true});});
})();
