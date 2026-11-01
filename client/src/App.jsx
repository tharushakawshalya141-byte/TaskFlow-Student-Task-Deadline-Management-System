import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, CalendarDays, BookOpen, CheckCircle2, Clock3, Plus, Search, Bell, ChevronDown, MoreHorizontal, Pencil, Trash2, X, LogOut, ListTodo, Sparkles, Menu } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const today = () => new Date().toISOString().slice(0, 10);
const demoTasks = [
  { _id:'demo1', title:'Complete calculus problem set', subject:'Mathematics', dueDate:new Date(Date.now()+86400000).toISOString(), priority:'High', status:'In progress', description:'Finish questions 1–12 and review the worked examples.' },
  { _id:'demo2', title:'Read chapter 6 — Cell Biology', subject:'Biology', dueDate:new Date(Date.now()+2*86400000).toISOString(), priority:'Medium', status:'To do', description:'Make summary notes for the key processes.' },
  { _id:'demo3', title:'Physics lab report', subject:'Physics', dueDate:new Date(Date.now()+3*86400000).toISOString(), priority:'High', status:'To do', description:'Add observations, calculations and conclusion.' },
  { _id:'demo4', title:'English essay draft', subject:'English', dueDate:new Date(Date.now()-86400000).toISOString(), priority:'Medium', status:'To do', description:'Draft the introduction and three main paragraphs.' },
  { _id:'demo5', title:'Review lecture notes', subject:'Computer Science', dueDate:new Date(Date.now()-2*86400000).toISOString(), priority:'Low', status:'Completed', description:'Review the notes from this week.' },
];
const dateLabel = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const isOverdue = t => t.status !== 'Completed' && new Date(t.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

function App(){
  const [token,setToken]=useState(localStorage.getItem('stm_token')||'');
  const [user,setUser]=useState(JSON.parse(localStorage.getItem('stm_user')||'null'));
  const [tasks,setTasks]=useState(demoTasks);
  const [demo,setDemo]=useState(!localStorage.getItem('stm_token'));
  const [view,setView]=useState('Overview');
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState('All tasks');
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [toast,setToast]=useState('');
  const [authMode,setAuthMode]=useState('login');
  const [authForm,setAuthForm]=useState({name:'',email:'',password:''});
  const [authError,setAuthError]=useState('');
  const [form,setForm]=useState({title:'',subject:'',description:'',dueDate:today(),priority:'Medium',status:'To do'});
  const [mobileNav,setMobileNav]=useState(false);

  const request=async(path,options={})=>{
    const res=await fetch(`${API}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...(options.headers||{})}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message||'Something went wrong');
    return data;
  };
  const loadTasks=async()=>{try{const data=await request('/tasks');setTasks(data);setDemo(false);}catch(e){if(token){setToast(e.message);}}};
  useEffect(()=>{if(token){loadTasks();setDemo(false);}},[token]);

  const notify=msg=>{setToast(msg);setTimeout(()=>setToast(''),2800);};
  const logout=()=>{localStorage.removeItem('stm_token');localStorage.removeItem('stm_user');setToken('');setUser(null);setTasks(demoTasks);setDemo(true);notify('Logged out successfully');};
  const handleAuth=async e=>{
    e.preventDefault();setAuthError('');
    try{
      const data=await request(`/auth/${authMode}`,{method:'POST',body:JSON.stringify(authForm)});
      localStorage.setItem('stm_token',data.token);localStorage.setItem('stm_user',JSON.stringify(data.user));
      setToken(data.token);setUser(data.user);setDemo(false);notify(authMode==='login'?'Welcome back!':'Account created successfully');
    }catch(e){setAuthError(e.message);}
  };
  const stats=useMemo(()=>({total:tasks.length,completed:tasks.filter(t=>t.status==='Completed').length,inProgress:tasks.filter(t=>t.status==='In progress').length,overdue:tasks.filter(isOverdue).length}),[tasks]);
  const visible=useMemo(()=>tasks.filter(t=>{
    const q=search.toLowerCase();
    const matches=[t.title,t.subject,t.description].some(x=>(x||'').toLowerCase().includes(q));
    const matchesFilter=filter==='All tasks'||(filter==='Overdue'?isOverdue(t):t.status===filter);
    const matchesView=view==='My tasks'?t.status!=='Completed':view==='Upcoming'?t.status!=='Completed'&&!isOverdue(t):view==='Completed'?t.status==='Completed':true;
    return matches&&matchesFilter&&matchesView;
  }),[tasks,search,filter,view]);
  const openNew=()=>{setEditing(null);setForm({title:'',subject:'',description:'',dueDate:today(),priority:'Medium',status:'To do'});setModal(true);};
  const openEdit=t=>{setEditing(t);setForm({title:t.title,subject:t.subject||'',description:t.description||'',dueDate:new Date(t.dueDate).toISOString().slice(0,10),priority:t.priority,status:t.status});setModal(true);};
  const saveTask=async e=>{
    e.preventDefault();
    if(!form.title.trim()){notify('Please enter a task title');return;}
    const payload={...form,dueDate:new Date(`${form.dueDate}T23:59:00`).toISOString()};
    if(demo){
      if(editing)setTasks(old=>old.map(t=>t._id===editing._id?{...t,...payload}:t));
      else setTasks(old=>[{...payload,_id:`demo-${Date.now()}`},...old]);
      notify(editing?'Task updated':'Task added');setModal(false);return;
    }
    try{
      const task=await request(editing?`/tasks/${editing._id}`:'/tasks',{method:editing?'PUT':'POST',body:JSON.stringify(payload)});
      setTasks(old=>editing?old.map(t=>t._id===task._id?task:t):[task,...old]);setModal(false);notify(editing?'Task updated':'Task added');
    }catch(e){notify(e.message);}
  };
  const deleteTask=async t=>{
    if(!confirm(`Delete "${t.title}"?`))return;
    if(demo){setTasks(old=>old.filter(x=>x._id!==t._id));notify('Task deleted');return;}
    try{await request(`/tasks/${t._id}`,{method:'DELETE'});setTasks(old=>old.filter(x=>x._id!==t._id));notify('Task deleted');}catch(e){notify(e.message);}
  };
  const changeStatus=async(t,status)=>{
    if(demo){setTasks(old=>old.map(x=>x._id===t._id?{...x,status}:x));return;}
    try{const updated=await request(`/tasks/${t._id}`,{method:'PUT',body:JSON.stringify({status})});setTasks(old=>old.map(x=>x._id===t._id?updated:x));}catch(e){notify(e.message);}
  };
  const nav=[{name:'Overview',icon:LayoutDashboard},{name:'My tasks',icon:ListTodo},{name:'Upcoming',icon:CalendarDays},{name:'Completed',icon:CheckCircle2}];

  if(!token && !demo) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark">✓</div><h1>Welcome to Taskly</h1><p className="muted">Your study life, organized.</p><form onSubmit={handleAuth}>{authMode==='register'&&<label>Full name<input required value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Alex Morgan"/></label>}<label>Email address<input type="email" required value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@school.edu"/></label><label>Password<input type="password" minLength="6" required value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 6 characters"/></label>{authError&&<p className="error">{authError}</p>}<button className="primary full">{authMode==='login'?'Log in':'Create account'}</button></form><p className="auth-switch">{authMode==='login'?'New to Taskly?':'Already have an account?'} <button onClick={()=>{setAuthMode(authMode==='login'?'register':'login');setAuthError('')}}>{authMode==='login'?'Create account':'Log in'}</button></p><button className="text-button" onClick={()=>setDemo(true)}>Continue with demo data</button></div></div>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <div className="brand"><div className="brand-mark">✓</div><span>taskly<span className="brand-dot">.</span></span><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(n=><button key={n.name} className={`nav-item ${view===n.name?'active':''}`} onClick={()=>{setView(n.name);setMobileNav(false)}}><n.icon size={18}/><span>{n.name}</span>{n.name==='My tasks'&&<span className="nav-count">{tasks.filter(t=>t.status!=='Completed').length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="sparkle"><Sparkles size={18}/></div><strong>Make room for focus</strong><p>Small steps today make big results tomorrow.</p><div className="progress-track"><div className="progress-fill" style={{width:`${stats.total?stats.completed/stats.total*100:0}%`}}/></div><small>{stats.completed} of {stats.total} tasks completed</small></div><div className="profile-row"><div className="avatar">{(user?.name||'Student').slice(0,1).toUpperCase()}</div><div className="profile-info"><strong>{user?.name||'Demo Student'}</strong><small>{user?.email||'student@example.com'}</small></div><button className="icon-button" title={token?'Log out':'Sign in'} onClick={()=>token?logout():(setDemo(false),setAuthMode('login'))}>{token?<LogOut size={17}/>:<ChevronDown size={17}/>}</button></div></div>
    </aside>
    {mobileNav&&<div className="mobile-scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="mobile-menu icon-button" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{view}</strong></div></div><div className="top-actions"><div className="today-chip"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div><button className="notification icon-button" title="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{(user?.name||'S').slice(0,1).toUpperCase()}</div></div></header>
      <div className="page-content">
        {demo&&<div className="demo-banner"><span><Sparkles size={16}/> You’re exploring with sample data. Changes stay in this browser.</span><button onClick={()=>{setDemo(false);setAuthMode('register')}}>Create account <span>→</span></button></div>}
        <section className="welcome-row"><div><div className="eyebrow">YOUR PERSONAL STUDY PLANNER</div><h1>{view==='Overview'?'Good morning':view}<span className="wave">{view==='Overview'?' 👋':''}</span></h1><p className="muted">{view==='Overview'?'Let’s make today productive. Here’s your study progress.':'Keep your tasks organized and your deadlines under control.'}</p></div><button className="primary add-button" onClick={openNew}><Plus size={18}/> Add new task</button></section>
        <section className="stats-grid">
          <StatCard title="Total tasks" value={stats.total} note="Across all subjects" icon={ListTodo} tone="purple" />
          <StatCard title="Completed" value={stats.completed} note={`${stats.total?Math.round(stats.completed/stats.total*100):0}% completion rate`} icon={CheckCircle2} tone="green" />
          <StatCard title="In progress" value={stats.inProgress} note="Keep the momentum" icon={Clock3} tone="blue" />
          <StatCard title="Overdue" value={stats.overdue} note={stats.overdue?'Needs your attention':'You’re all caught up'} icon={CalendarDays} tone="orange" />
        </section>
        <section className="content-grid">
          <div className="panel tasks-panel"><div className="panel-header"><div><h2>{view==='Overview'?'Your tasks':view}</h2><p className="muted">{view==='Overview'?'Everything you need to stay on track':'Manage your assignments and deadlines'}</p></div><button className="more-button" onClick={()=>setFilter(filter==='All tasks'?'To do':'All tasks')} title="Toggle task filter"><MoreHorizontal size={21}/></button></div>
            <div className="task-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search tasks..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch('')}><X size={14}/></button>}</div><select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filter tasks"><option>All tasks</option><option>To do</option><option>In progress</option><option>Completed</option><option>Overdue</option></select></div>
            <div className="task-list">{visible.length?visible.map(t=><TaskRow key={t._id} task={t} onEdit={openEdit} onDelete={deleteTask} onStatus={changeStatus}/>):<div className="empty-state"><div className="empty-icon"><CheckCircle2 size={24}/></div><strong>Nothing on your list</strong><p>Try another filter or add a task to get started.</p><button className="secondary" onClick={openNew}><Plus size={15}/> Add a task</button></div>}</div>
            <div className="panel-footer"><span>Showing <strong>{visible.length}</strong> of {tasks.length} tasks</span><button onClick={()=>{setView('My tasks');setFilter('All tasks')}}>View all tasks <span>→</span></button></div>
          </div>
          <div className="right-column">
            <div className="panel deadline-panel"><div className="panel-header"><div><h2>Upcoming deadlines</h2><p className="muted">What’s coming up next</p></div><CalendarDays size={19} className="header-icon"/></div><div className="deadline-list">{tasks.filter(t=>t.status!=='Completed'&&!isOverdue(t)).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).slice(0,4).map(t=><div className="deadline-item" key={t._id}><div className="date-box"><strong>{new Date(t.dueDate).getDate()}</strong><small>{new Date(t.dueDate).toLocaleDateString('en-US',{month:'short'}).toUpperCase()}</small></div><div className="deadline-info"><strong>{t.title}</strong><small>{t.subject||'General'}</small></div><span className={`priority-dot ${t.priority.toLowerCase()}`}/></div>)}{!tasks.some(t=>t.status!=='Completed'&&!isOverdue(t))&&<p className="empty-small">No upcoming deadlines 🎉</p>}</div><button className="panel-link" onClick={()=>setView('Upcoming')}>See calendar <span>→</span></button></div>
            <div className="focus-card"><div className="focus-icon"><Sparkles size={19}/></div><div className="focus-tag">A LITTLE REMINDER</div><h3>Progress over perfection.</h3><p>One focused session at a time. You’ve got this!</p><div className="focus-decoration">✳</div></div>
          </div>
        </section>
        <footer className="footer"><span>© 2026 Taskly Student Planner</span><span>Made for better study habits <span className="heart">♥</span></span></footer>
      </div>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="task-modal" onSubmit={saveTask}><div className="modal-heading"><div><h2>{editing?'Edit task':'Create a task'}</h2><p className="muted">Add details to keep your work on track.</p></div><button type="button" className="icon-button" onClick={()=>setModal(false)}><X size={20}/></button></div><label>Task title *<input required maxLength="160" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Finish physics assignment"/></label><div className="form-row"><label>Subject<input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Physics"/></label><label>Deadline *<input type="date" required value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></label></div><label>Description / notes<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What needs to be done?"/></label><div className="form-row"><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>To do</option><option>In progress</option><option>Completed</option></select></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary"><Plus size={16}/>{editing?'Save changes':'Create task'}</button></div></form></div>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
function StatCard({title,value,note,icon:Icon,tone}){return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div><div className={`stat-accent ${tone}`}/></div>}
function TaskRow({task,onEdit,onDelete,onStatus}){return <div className={`task-row ${isOverdue(task)?'overdue-row':''}`}><button className={`task-check ${task.status==='Completed'?'checked':''}`} onClick={()=>onStatus(task,task.status==='Completed'?'To do':'Completed')} title="Toggle completed">{task.status==='Completed'&&<CheckCircle2 size={15}/>}</button><div className="task-main"><div className="task-title-line"><strong className={task.status==='Completed'?'completed-title':''}>{task.title}</strong>{isOverdue(task)&&<span className="overdue-pill">Overdue</span>}</div><div className="task-meta"><span className="subject-icon"><BookOpen size={13}/>{task.subject||'General'}</span><span className="meta-separator">·</span><span><CalendarDays size={13}/>{dateLabel(task.dueDate)}</span></div></div><span className={`priority-pill ${task.priority.toLowerCase()}`}>{task.priority}</span><select className={`status-select ${task.status.toLowerCase().replace(' ','-')}`} value={task.status} onChange={e=>onStatus(task,e.target.value)} aria-label={`Status for ${task.title}`}><option>To do</option><option>In progress</option><option>Completed</option></select><div className="row-actions"><button title="Edit task" onClick={()=>onEdit(task)}><Pencil size={15}/></button><button title="Delete task" onClick={()=>onDelete(task)}><Trash2 size={15}/></button></div></div>}
export default App;
