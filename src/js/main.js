document.addEventListener('DOMContentLoaded', ()=>{
  const tbody=document.querySelector('#data-table tbody');
  function newRow(x='',y=''){
    const tr=document.createElement('tr');
    const tx=document.createElement('td');const ty=document.createElement('td');
    tx.contentEditable=ty.contentEditable=true;tx.innerText=x;ty.innerText=y;
    tr.appendChild(tx);tr.appendChild(ty);tbody.appendChild(tr);
  }
  for(let i=0;i<10;i++) newRow();

  function readData(){
    return [...tbody.children].map(tr=>{
      const x=parseFloat(tr.children[0].innerText);
      const y=parseFloat(tr.children[1].innerText);
      return (isFinite(x)&&isFinite(y))?{x,y}:null;
    }).filter(Boolean);
  }

  document.getElementById('btn-fit').onclick=()=>{
    const data=readData();if(data.length<2)return;
    const type=document.getElementById('fit-type').value;
    const deg=parseInt(document.getElementById('poly-degree').value||2);
    const res=Regression.perform(type,data,deg);
    Plotter.plotScatterWithFit(document.getElementById('plot'),data,res.predict);
    Logger.clear();
    Logger.info(res.text);
  };

  document.getElementById('clear-table').onclick=()=>{
    tbody.innerHTML='';for(let i=0;i<10;i++)newRow();
    Logger.clear();Plotly.purge(document.getElementById('plot'));
  };

  const file=document.getElementById('file-csv');
  file.onchange=(e)=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{const d=Utils.parseCSV(r.result);tbody.innerHTML='';d.forEach(v=>newRow(v.x,v.y));};
    r.readAsText(f);
  };
});
