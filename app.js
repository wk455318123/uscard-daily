document.addEventListener("DOMContentLoaded", function(){

var CM={"美卡论坛":"论坛","知识星球":"星球","美卡博客":"博客","公众号":"公号","小红书":"红书","微信群聊":"群聊"};
var TK={"信用卡":["信用卡","美卡","开卡","amex","chase","citi","boa","nll","返现","积分","bonus","offer","platinum","gold","aspire","csr","bilt","refer"],"航空":["里程","航空","united","delta","alaska","mile","fly","aeroplan","商务舱","机票","航班","南航","国航"],"酒店":["酒店","hotel","hyatt","hilton","marriott","ihg","凯悦","希尔顿","万豪","雅高","度假","fhr","resort","club med"],"银行":["银行","bank","checking","saving","开户","sofi","chime","报税","理财","投资","plaid"],"风控":["封","block","盗刷","风控","4506","kyc","拒","冻结","风险","预警"]};

var D=[],aCh="summary",aTp="",sQ="",curDate="",curSummary="";

async function init(){
  var available=[];
  try{
    var r=await fetch("data/manifest.json");
    if(r.ok) available=await r.json();
  }catch(e){}

  if(available.length===0){
    var today=new Date();
    for(var i=0;i<7;i++){
      var d=new Date(today);d.setDate(d.getDate()-i);
      var ds=d.toISOString().slice(0,10);
      try{
        var r2=await fetch("data/"+ds+".json");
        if(r2.ok)available.push(ds);
      }catch(e){}
    }
  }

  if(available.length===0){
    document.getElementById("ls").innerHTML='<div class="loading">暂无数据</div>';
    return;
  }

  var dh=available.map(function(ds,i){
    return '<button class="date-btn'+(i===0?' on':'')+'" data-d="'+ds+'">'+ds.slice(5)+'</button>';
  }).join("");
  document.getElementById("dates").innerHTML=dh;

  await loadDate(available[0]);
}

async function loadDate(ds){
  curDate=ds;
  document.querySelectorAll(".date-btn").forEach(function(b){
    b.classList.toggle("on",b.dataset.d===ds);
  });
  document.getElementById("ls").innerHTML='<div class="loading">加载 '+ds+' ...</div>';

  try{
    var r=await fetch("data/"+ds+".json");
    D=await r.json();

    // 加载汇总
    curSummary="";
    try{
      var rs=await fetch("data/summary-"+ds+".json");
      if(rs.ok){var sj=await rs.json();curSummary=sj.summary||"";}
    }catch(e){}

    var ch={};
    D.forEach(function(i){ch[i.channel]=(ch[i.channel]||0)+1;});
    var sh=Object.entries(ch).map(function(e){return '<span class="st">'+(CM[e[0]]||e[0])+' '+e[1]+'</span>';}).join("");
    sh+='<span class="st">共 '+D.length+' 条</span>';
    document.getElementById("stats").innerHTML=sh;

    // 默认显示汇总
    aCh="summary";
    document.querySelectorAll(".fb").forEach(function(x){x.classList.remove("on")});
    document.querySelector('.fb[data-c="summary"]').classList.add("on");
    R();
  }catch(e){
    document.getElementById("ls").innerHTML='<div class="loading">加载失败: '+e.message+'</div>';
  }
}

document.getElementById("dates").addEventListener("click",function(e){
  if(e.target.classList.contains("date-btn"))loadDate(e.target.dataset.d);
});

document.querySelector(".ctl").addEventListener("click",function(e){
  var b=e.target;
  if(b.classList.contains("fb")){
    document.querySelectorAll(".fb").forEach(function(x){x.classList.remove("on")});
    b.classList.add("on");aCh=b.dataset.c;R();
  }
  if(b.classList.contains("tb")){
    if(b.classList.contains("on")){b.classList.remove("on");aTp="";}
    else{document.querySelectorAll(".tb").forEach(function(x){x.classList.remove("on")});b.classList.add("on");aTp=b.dataset.t;}
    R();
  }
});
document.getElementById("q").addEventListener("input",function(){sQ=this.value.trim().toLowerCase();R();});
document.getElementById("ls").addEventListener("click",function(e){
  if(e.target.tagName==="A"||e.target.closest("a"))return;
  var it=e.target.closest(".it");
  if(it)it.classList.toggle("ex");
});

function md2html(md){
  // 简易 markdown 转 HTML
  var lines=md.split("\n");
  var html=[];
  for(var i=0;i<lines.length;i++){
    var l=lines[i];
    if(/^---\s*$/.test(l)){html.push('<hr>');continue;}
    if(/^#{1,2}\s/.test(l)){
      var lvl=l.match(/^(#+)/)[1].length;
      var txt=l.replace(/^#+\s*/,"");
      html.push('<h'+lvl+' class="sm-h'+lvl+'">'+txt+'</h'+lvl+'>');
      continue;
    }
    if(/^\*\*\d+\./.test(l)||/^\*\*[^*]+\*\*$/.test(l)){
      var txt=l.replace(/\*\*/g,"");
      html.push('<div class="sm-bold">'+txt+'</div>');
      continue;
    }
    if(/^- /.test(l)){
      html.push('<div class="sm-li">'+l.substring(2)+'</div>');
      continue;
    }
    if(l.trim()==="")continue;
    // 处理行内粗体和来源标记
    var processed=l.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    html.push('<div class="sm-p">'+processed+'</div>');
  }
  return html.join("\n");
}

function mt(item,tp){
  if(!tp)return true;
  var kw=TK[tp]||[];
  var t=((item.title||"")+" "+(item.description||"")+" "+(item.category||"")).toLowerCase();
  return kw.some(function(k){return t.indexOf(k.toLowerCase())>=0;});
}
function esc(s){
  return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function hl(text,q){
  var s=esc(text);if(!q)return s;
  try{var re=new RegExp("("+q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi");return s.replace(re,'<span class="hl">$1</span>');}
  catch(e){return s;}
}
function R(){
  // 汇总模式
  if(aCh==="summary"){
    document.getElementById("cnt").textContent=curDate+" | 今日重点汇总";
    if(curSummary){
      document.getElementById("ls").innerHTML='<div class="summary-view">'+md2html(curSummary)+'</div>';
    }else{
      document.getElementById("ls").innerHTML='<div class="loading">该日期暂无汇总</div>';
    }
    return;
  }

  var f=D.filter(function(i){
    if(aCh!=="all"&&i.channel!==aCh)return false;
    if(!mt(i,aTp))return false;
    if(sQ){var t=((i.title||"")+" "+(i.description||"")+" "+(i.category||"")+" "+(i.channel||"")).toLowerCase();if(t.indexOf(sQ)<0)return false;}
    return true;
  });
  document.getElementById("cnt").textContent=curDate+" | 显示 "+f.length+" / "+D.length+" 条";
  var h=f.map(function(i){
    var tg=CM[i.channel]||i.channel;
    var desc=i.description||i.first_post||"";
    var has=desc.length>0||i.link;
    var d="";
    if(has){
      d='<div class="dt">';
      if(desc)d+='<div class="dx">'+hl(desc,sQ)+'</div>';
      if(i.link)d+='<a class="dl" href="'+esc(i.link)+'" target="_blank" rel="noopener">查看原文 ↗</a>';
      d+='</div>';
    }
    var mp=[];
    if(i.date)mp.push(i.date);
    if(i.category&&i.category!==i.channel)mp.push(i.category);
    if(i.reply_count)mp.push(i.reply_count+"回复");
    if(i.likes)mp.push(i.likes+"赞");
    if(i.comments)mp.push(i.comments+"评论");
    if(i.author)mp.push(i.author);
    var m=mp.join(" · ");
    return '<div class="it"><div class="ih"><span class="tg t-'+tg+'">'+tg+'</span><div style="flex:1"><div class="tt">'+hl(i.title,sQ)+'</div>'+(m?'<div class="mt">'+esc(m)+'</div>':'')+'</div>'+(has?'<span class="ar">›</span>':'')+'</div>'+d+'</div>';
  }).join("");
  document.getElementById("ls").innerHTML=h||'<div style="text-align:center;padding:40px;color:#484f58">无匹配内容</div>';
}

init().catch(function(e){
  document.getElementById("ls").innerHTML='<div class="loading">初始化失败: '+e.message+'</div>';
});

}); // end DOMContentLoaded
