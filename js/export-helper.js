export function safeFileName(name="dokumen"){
  return String(name).replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"_").slice(0,120);
}

export function downloadWord(filename, html){
  try{
    const fullHtml = html.includes('<!doctype html>') ? html : `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], {type:'application/msword;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName(filename.endsWith('.doc') ? filename : filename + '.doc');
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 3000);
    return true;
  }catch(err){
    console.error('Download Word gagal',err);
    alert('Unduh Word gagal: '+err.message);
    return false;
  }
}

export function printPdf(html, title='Dokumen Supervisi'){
  try{
    const frame=document.createElement('iframe');
    frame.style.position='fixed';
    frame.style.right='0';
    frame.style.bottom='0';
    frame.style.width='1px';
    frame.style.height='1px';
    frame.style.border='0';
    frame.style.opacity='0';
    frame.setAttribute('aria-hidden','true');
    document.body.appendChild(frame);

    const doc=frame.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    doc.title=title;

    const doPrint=()=>{
      try{
        frame.contentWindow.focus();
        frame.contentWindow.print();
      }catch(err){
        console.error(err);
        alert('Cetak/PDF gagal dibuka: '+err.message);
      }finally{
        setTimeout(()=>frame.remove(),4000);
      }
    };

    setTimeout(doPrint,900);
    return true;
  }catch(err){
    console.error('Print PDF gagal',err);
    alert('Cetak/PDF gagal: '+err.message);
    return false;
  }
}
