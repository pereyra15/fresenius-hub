import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE ENTORNO Y FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCsWVfOwrluoXkJ2DZI53riT1GP7hfgO1s",
      authDomain: "fresenius-hub.firebaseapp.com",
      projectId: "fresenius-hub",
      storageBucket: "fresenius-hub.firebasestorage.app",
      messagingSenderId: "716717456335",
      appId: "1:716717456335:web:34cce7beae617a9de870ba"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fresenius-hub-v1';

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycby-qGJlQG_vxJMxqYKK0EBDkFJXLbLi7Gby7fCpej0ZnDgMpT0YsXELWwbvxOVsrTSkhg/exec"; 

const mockEngineers = [
  'WS06 JORGE VELAZQUEZ', 'WS07 EDGAR NUÑO', 'WS09 ZAHIRA ISLAS',
  'WS10 JUAN CARLOS SAAVEDRA', 'WS11 JORGE DIAZ', 'WS12 HIRAM ALVAREZ', 'WS15 VICTOR ENRIQUEZ'
];

const fallaMapping = [
  { key: 'General', code: 'FA22', desc: 'TCT-Generales' },
  { key: 'Recertificaci', code: 'FA23', desc: 'TCT-Recertificación' },
  { key: 'Instalaci', code: 'FA24', desc: 'TCT-Instalación' },
  { key: 'Asesoria', code: 'FA25', desc: 'TCT-Asesoría' },
  { key: 'Calibra', code: 'FA26', desc: 'TCT-Calibración' },
  { key: 'Kit', code: 'FA27', desc: 'TCT-Problema con kit' },
  { key: 'Atenci', code: 'FA28', desc: 'TCT-Atención remota' },
  { key: 'Parte', code: 'FA29', desc: 'TCT-Partes de equipo' },
  { key: 'Clamp', code: 'FA30', desc: 'TCT-Clamp' },
  { key: 'Comprobaci', code: 'FA31', desc: 'TCT-Comprobación de cierre' },
  { key: 'Presi', code: 'FA32', desc: 'TCT-Perdida de vacío' },
  { key: 'Vac', code: 'FA32', desc: 'TCT-Perdida de vacío' },
  { key: 'Perita', code: 'FA33', desc: 'TCT-Perita/Manguito desconectado' },
  { key: 'Membrana', code: 'FA34', desc: 'TCT-Membrana' },
  { key: 'Interface', code: 'FA35', desc: 'TCT-Detector de interfaz' },
  { key: 'Humedad', code: 'FA36', desc: 'TCT-Sensor de humedad' },
  { key: 'Sell', code: 'FA37', desc: 'TCT-Módulo de RF' }, 
  { key: 'Cable', code: 'FA38', desc: 'TCT-Cable' },
  { key: 'Tarjeta', code: 'FA39', desc: 'TCT-Tarjeta principal' },
  { key: 'Bater', code: 'FA40', desc: 'TCT-Batería' },
  { key: 'Prensa', code: 'FA41', desc: 'TCT-Prensas' },
  { key: 'Balanza', code: 'FA42', desc: 'TCT-Balanzas' },
  { key: 'Uso', code: 'FA45', desc: 'TCT-Mal Uso' },
  { key: 'Preventivo', code: 'FA46', desc: 'TCT-Preventivo' },
];

const Input = ({ label, name, type = 'text', value, onChange, maxLength, inputMode, readOnly, placeholder, list }) => (
  <div className="mb-4 text-left">
    <label className="block text-gray-700 text-[10px] font-black mb-1 uppercase tracking-wider">{label}</label>
    <input
      className={`w-full p-4 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-100 focus:border-blue-500'}`}
      type={type} name={name} value={value} onChange={onChange} maxLength={maxLength} 
      inputMode={inputMode} readOnly={readOnly} placeholder={placeholder} list={list}
    />
  </div>
);

const TextArea = ({ label, name, value, onChange, rows = 3, placeholder, readOnly }) => (
  <div className="mb-4 text-left">
    <label className="block text-gray-700 text-[10px] font-black mb-1 uppercase tracking-wider">{label}</label>
    <textarea
      className={`w-full p-4 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-100 focus:border-blue-500'}`}
      name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} readOnly={readOnly}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options, placeholder = "Seleccionar..." }) => (
  <div className="mb-4 text-left">
    <label className="block text-gray-700 text-[10px] font-black mb-1 uppercase tracking-wider">{label}</label>
    <select
      className={`w-full p-4 border rounded-2xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none border-gray-100 ${value === '' ? 'text-gray-400' : 'text-gray-700'}`}
      name={name} value={value} onChange={onChange}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);

const MenuButton = ({ label, subScreenId, svgIcon, setMenuSubScreen, menuSubScreen }) => {
  const isActive = menuSubScreen === subScreenId;
  return (
    <button
      onClick={() => setMenuSubScreen(subScreenId)}
      className={`flex items-center p-5 rounded-[1.5rem] transition-all transform hover:scale-[1.02] shadow-lg w-full border-2
        ${isActive ? 'bg-blue-600 text-white shadow-blue-400/50 border-blue-600' : 'bg-white text-gray-800 hover:bg-blue-50 border-gray-50'}`}
    >
      <div className={`mr-4 ${isActive ? 'text-white' : 'text-blue-600'}`}>
        <div className="w-8 h-8">{svgIcon}</div>
      </div>
      <span className="font-black text-lg text-left flex-1 tracking-tight">{label}</span>
      <div className={`ml-2 ${isActive ? 'text-blue-200' : 'text-gray-300'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
      </div>
    </button>
  );
};

const EquiposSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><path d="M10 2v4M14 2v4M6 13h12M6 17h12M6 9h12"></path></svg>
);
const ReporteEquiposSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.93-3.89L6 19l2.16-4.32L4 12l4.16-2.68L6 5l4.07 1.25L12 2l1.93 4.25L18 5l-2.16 4.32L20 12l-4.16 2.68L18 19l-4.07-1.56L12 21.35zM12 8v4M12 16h.01"></path></svg>
);
const MaterialApoyoSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2zM10 10l-2 2 2 2"></path></svg>
);
const ContactosSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const LandingScreen = ({ setScreen }) => (
  <div className="flex flex-col gap-6 animate-fadeIn pb-10">
    <div className="text-center mb-10">
      <img src="https://lh3.googleusercontent.com/d/1xl3VUyb0n-2wDlaBO06KRamI13PuWX8z" alt="Logo Hub" className="w-[76px] h-[76px] object-cover rounded-full mx-auto mb-4 shadow-sm bg-white" />
      <h1 className="text-5xl font-black text-blue-700 tracking-tighter">FRESENIUS</h1>
      <p className="text-[10px] font-black text-gray-400 tracking-[0.4em] mt-2 uppercase">Engineering Hub</p>
    </div>
    <button onClick={() => setScreen('register')} className="p-8 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-xl hover:border-blue-500 transition-all group flex items-center gap-6">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div>
      <div className="text-left"><span className="block font-black text-gray-800 text-lg uppercase tracking-tight leading-none">Registrarse</span><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Crear nueva cuenta</span></div>
    </button>
    <button onClick={() => setScreen('login')} className="p-8 bg-blue-600 rounded-[2.5rem] shadow-xl hover:bg-blue-700 transition-all group flex items-center gap-6">
      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg></div>
      <div className="text-left"><span className="block font-black text-white text-lg uppercase tracking-tight leading-none">Ingresar</span><span className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Acceso restringido</span></div>
    </button>
  </div>
);

const RegisterScreen = ({ form, onChange, onSubmit, loading, setScreen }) => (
  <div className="animate-fadeIn pb-10">
    <div className="flex items-center gap-4 mb-8"><button onClick={() => setScreen('landing')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">←</button><h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Registro</h2></div>
    <div className="space-y-1">
      <Select label="Nombre de Ingeniero *" name="engineerName" value={form.engineerName} onChange={onChange} options={mockEngineers} />
      <Input label="Correo Electrónico *" name="email" type="email" value={form.email} onChange={onChange} placeholder="ejemplo@fmc-ag.com" />
      <Input label="Teléfono de Contacto *" name="phone" value={form.phone} onChange={onChange} placeholder="5512345678" />
      <Input label="Contraseña (PIN) *" name="password" type="password" value={form.password} onChange={onChange} maxLength={6} placeholder="••••••" />
      <button onClick={onSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl mt-4 shadow-xl active:scale-95 transition-all uppercase disabled:opacity-50">{loading ? 'Procesando...' : 'Crear Cuenta'}</button>
      <p className="text-[8px] font-black text-gray-400 uppercase mt-4 text-center tracking-widest">* Todos los campos son obligatorios</p>
    </div>
  </div>
);

const LoginScreen = ({ form, onChange, onSubmit, loading, setScreen }) => (
  <div className="animate-fadeIn pb-10">
    <div className="flex items-center gap-4 mb-8"><button onClick={() => setScreen('landing')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">←</button><h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Ingreso</h2></div>
    <div className="space-y-1">
      <Select label="Seleccionar Ingeniero *" name="engineerName" value={form.engineerName} onChange={onChange} options={mockEngineers} />
      <Input label="PIN de Acceso *" name="password" type="password" value={form.password} onChange={onChange} maxLength={6} placeholder="••••••" />
      <button onClick={onSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl mt-8 shadow-xl active:scale-95 transition-all uppercase disabled:opacity-50">{loading ? 'Verificando...' : 'Entrar'}</button>
      <p className="text-[8px] font-black text-gray-400 uppercase mt-4 text-center tracking-widest">* PIN e Ingeniero son obligatorios</p>
    </div>
  </div>
);

const MenuScreen = ({ 
  menuSubScreen, setMenuSubScreen, loginForm, setScreen, setMessage, setError, userId, db,
  contacts, addContact, deleteContact, serviceOrders, sheetOrders, setSheetOrders, equipment,
  documentationSubScreen, setDocumentationSubScreen, currentSparePartView, setCurrentSparePartView
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showResetOSConfirm, setShowResetOSConfirm] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', unit: '', email: '' });
  
  const [sparePartsData, setSparePartsData] = useState([]);
  const [loadingSpares, setLoadingSpares] = useState(false);
  
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [closingOrder, setClosingOrder] = useState(false);

  const [reportForm, setReportForm] = useState({
    tipoOS: '', serie: '', modelo: '', descripcionEquipo: '', fechaSolicitud: new Date().toISOString().split('T')[0],
    ano: new Date().getFullYear().toString(), cliente: '', ingeniero: loginForm.engineerName || '',
    falla: '', area: '', reporta: '', contacto: '', telefono: '', email: '', observaciones: '',
    catalogoFalla: 'FKMX-CS', codigoFalla: '', descripcionFalla: ''
  });

  const resetOSForm = () => {
    setReportForm({
      tipoOS: '', serie: '', modelo: '', descripcionEquipo: '', fechaSolicitud: new Date().toISOString().split('T')[0],
      ano: new Date().getFullYear().toString(), cliente: '', ingeniero: loginForm.engineerName || '',
      falla: '', area: '', reporta: '', contacto: '', telefono: '', email: '', observaciones: '',
      catalogoFalla: 'FKMX-CS', codigoFalla: '', descripcionFalla: ''
    });
  };

  // --- LÓGICA DE RETORNO INTELIGENTE ---
  const handleSmartBack = () => {
    if (selectedOrderDetails) {
      setSelectedOrderDetails(null);
    } else if (currentSparePartView) {
      setCurrentSparePartView(null);
    } else if (documentationSubScreen) {
      setDocumentationSubScreen(null);
    } else if (menuSubScreen === 'generarOS' || menuSubScreen === 'ordenesAsignadas') {
      setMenuSubScreen('reporteEquipos');
    } else {
      // Si estamos en cualquier otra pantalla principal (equipos, reporteEquipos, materialApoyo, contactos), volvemos al dashboard
      setMenuSubScreen('dashboard');
    }
  };

  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'serie') {
        const found = equipment.find(eq => eq.serie === value);
        if (found) { 
          newState.modelo = found.modelo || ''; 
          newState.descripcionEquipo = found.descripcion; 
          newState.cliente = found.cliente; 
        }
      }
      if (name === 'reporta') {
        newState.contacto = value;
        const matched = contacts.find(c => c.name === value);
        if (matched) { newState.telefono = matched.phone || ''; newState.email = matched.email || ''; }
      }
      if (name === 'falla') {
        const text = value.toLowerCase();
        const match = fallaMapping.find(item => text.includes(item.key.toLowerCase()));
        if (match) { newState.codigoFalla = match.code; newState.descripcionFalla = match.desc; }
        else { newState.codigoFalla = 'FA43'; newState.descripcionFalla = 'TCT-Otro'; }
      }
      return newState;
    });
  };

  const submitReport = async () => {
    if (!reportForm.serie || !reportForm.falla) { setError("Campos de equipo y falla requeridos."); return; }
    setLoadingReport(true);
    try {
      if (!userId) throw new Error("No user session");

      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'service_orders'), {
        ...reportForm, 
        status: 'Abierto', 
        createdAt: new Date().toISOString(), 
        createdBy: userId, 
        engineerName: loginForm.engineerName
      });

      if (GOOGLE_SHEETS_URL) {
        try {
          await fetch(GOOGLE_SHEETS_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                ...reportForm, 
                action: 'CREATE',      
                firebaseId: docRef.id, 
                ESTATUS: 'Abierto'     
            }) 
          });
        } catch (e) { console.error("Sheet Sync Failed:", e); }
      }

      const novaMendo = {
        id: docRef.id,
        ...reportForm,
        status: 'Abierto',
        createdAt: new Date().toISOString(),
        engineerName: loginForm.engineerName
      };
      setSheetOrders(prev => [novaMendo, ...prev]);

      setMessage("ORDEN GENERADA Y SINCRONIZADA.");
      setMenuSubScreen('dashboard');
    } catch (e) { setError("Fallo al guardar reporte: " + e.message); }
    finally { setLoadingReport(false); }
  };

  const closeOrder = async (order) => {
    setClosingOrder(true);
    setSheetOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cerrado' } : o));
    setSelectedOrderDetails(prev => ({ ...prev, status: 'Cerrado' }));

    try {
      if (order.id && !String(order.id).startsWith('sheet-')) {
        const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'service_orders', order.id);
        try {
          await updateDoc(orderRef, { status: 'Cerrado', closedAt: new Date().toISOString() });
        } catch (firebaseErr) {
          console.warn("El documento no se encontró en la base de datos de Firebase, pero continuará la sincronización en Sheets.", firebaseErr);
        }
      }
      
      if (GOOGLE_SHEETS_URL) {
        try {
          await fetch(GOOGLE_SHEETS_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
              action: 'UPDATE',      
              firebaseId: order.id,  
              ESTATUS: 'Cerrado'     
            }) 
          });
        } catch (e) { console.error("Sheet Update Sync Failed:", e); }
      }

      setMessage("ORDEN FINALIZADA Y SINCRONIZADA.");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      console.error(e);
      setError("Cerrado localmente. Error general al sincronizar.");
    } finally {
      setClosingOrder(false);
    }
  };

  const fetchSpareParts = async (url, viewName) => {
    setLoadingSpares(true);
    setCurrentSparePartView(viewName);
    try {
      const response = await fetch(url);
      const text = await response.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = rows.slice(1).filter(r => r.trim()).map(row => {
        const values = []; let current = '', inQuote = false;
        for (let char of row) { if (char === '"') inQuote = !inQuote; else if (char === ',' && !inQuote) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; } else current += char; }
        values.push(current.trim().replace(/^"|"$/g, ''));
        const obj = {}; headers.forEach((h, i) => obj[h] = values[i] || '');
        return obj;
      });
      setSparePartsData(data);
    } catch (e) { setError("Fallo en sincronización de repuestos."); }
    finally { setLoadingSpares(false); }
  };

  const handleSaveContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.unit || !newContact.email) {
      setError("TODOS LOS CAMPOS DE LA AGENDA SON OBLIGATORIOS.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    try {
      await addContact({...newContact, client: newContact.unit, role: 'Contacto'});
      setNewContact({name:'', phone:'', unit:'', email:''});
      setShowAddContactForm(false);
      setMessage("CONTACTO GUARDADO.");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setError("Error al guardar contacto.");
    }
  };

  const renderContent = () => {
    switch (menuSubScreen) {
      case 'equipos':
        const filtered = equipment.filter(item => {
          const eng = (loginForm.engineerName || '').toLowerCase();
          const resp = (item.responsable || '').toLowerCase();
          const matchEng = eng.includes(resp) || resp.includes(eng);
          const matchTerm = (item.serie + (item.modelo || '') + (item.cliente || '')).toLowerCase().includes(searchTerm.toLowerCase());
          return matchEng && matchTerm;
        });
        return (
          <div className="bg-white rounded-[2rem] shadow-sm border flex flex-col overflow-hidden animate-fadeIn">
            <div className="p-4 bg-gray-50 border-b sticky top-0 z-10"><input type="text" placeholder="Buscar por Serie o Hospital..." className="w-full p-4 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <div className="flex-1 overflow-auto text-xs min-h-[400px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 font-black text-gray-400"><tr><th className="p-4 text-left">SERIE</th><th className="p-4 text-left">EQUIPO</th><th className="p-4 text-center">ST</th></tr></thead>
                <tbody className="divide-y text-left">
                  {filtered.length > 0 ? filtered.map(item => (
                    <tr key={item.id} onClick={() => setSelectedEquipment(item)} className="hover:bg-blue-50 cursor-pointer transition-colors active:bg-blue-100">
                      <td className="p-4 font-mono font-black text-blue-600">{item.serie}</td>
                      <td className="p-4"><div className="font-black text-gray-800 uppercase text-[10px]">{item.modelo}</div><div className="text-[9px] text-gray-400 uppercase tracking-tighter truncate max-w-[120px]">{item.cliente}</div></td>
                      <td className="p-4 text-center text-lg">{sheetOrders.some(so => so.serie === item.serie && so.status && so.status.toLowerCase().includes('abierto')) ? '🔴' : '🟢'}</td>
                    </tr>
                  )) : (<tr><td colSpan="3" className="p-10 text-center font-bold text-gray-300">Sin equipos asignados</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'reporteEquipos':
        return (
          <div className="grid gap-5 animate-fadeIn pb-20">
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-2">
              <h4 className="font-black text-blue-800 text-xs uppercase tracking-widest mb-1">Métricas Rápidas</h4>
              <div className="flex gap-4">
                <div className="flex-1"><span className="block text-2xl font-black text-blue-900">{sheetOrders.filter(so => so.engineerName === loginForm.engineerName && so.status && so.status.toLowerCase().includes('abierto')).length}</span><span className="text-[8px] font-black text-blue-500 uppercase">Abiertas</span></div>
                <div className="flex-1"><span className="block text-2xl font-black text-green-600">{sheetOrders.filter(so => so.engineerName === loginForm.engineerName && so.status && so.status.toLowerCase().includes('cerrado')).length}</span><span className="text-[8px] font-black text-green-500 uppercase">Cerradas</span></div>
              </div>
            </div>
            <button onClick={() => setMenuSubScreen('ordenesAsignadas')} className="p-10 bg-white border-2 border-gray-100 rounded-[2.5rem] font-black text-gray-800 shadow-xl flex flex-col items-center gap-3 active:scale-95 transition-all"><span className="text-5xl">📋</span> MIS ÓRDENES</button>
            <button onClick={() => setShowResetOSConfirm(true)} className="p-10 bg-blue-600 rounded-[2.5rem] font-black text-white shadow-xl flex flex-col items-center gap-3 active:scale-95 transition-all"><span className="text-5xl">➕</span> NUEVA OS</button>
          </div>
        );

      case 'generarOS':
        return (
          <div className="p-6 bg-white border rounded-[2rem] overflow-y-auto animate-fadeIn text-left shadow-sm pb-20">
            <h3 className="text-2xl font-black mb-8 text-gray-800 tracking-tighter border-b pb-4 uppercase">Nueva Orden</h3>
            <datalist id="contactos-agenda">{contacts.map(c => <option key={c.id} value={c.name}>{c.client}</option>)}</datalist>
            <Select label="Tipo de Servicio" name="tipoOS" value={reportForm.tipoOS} onChange={handleReportChange} options={['ZMXC (MTTO CORRECTIVO)', 'ZMXP (MTTO PREVENTIVO)', 'ZMXI (INSTALACIÓN)', 'ZMXA (ASESORÍA)']} />
            <Input label="Serie / SN" name="serie" value={reportForm.serie} onChange={handleReportChange} />
            <Input label="Modelo" name="modelo" value={reportForm.modelo} onChange={handleReportChange} readOnly />
            <Input label="Descripción del Equipo" name="descripcionEquipo" value={reportForm.descripcionEquipo} onChange={handleReportChange} readOnly />
            <Input label="Hospital" name="cliente" value={reportForm.cliente} onChange={handleReportChange} readOnly />
            <Select label="Área" name="area" value={reportForm.area} onChange={handleReportChange} options={['Recolección', 'Fraccionamiento', 'Aféresis']} />
            <TextArea label="Falla Reportada" name="falla" value={reportForm.falla} onChange={handleReportChange} />
            <Input label="Reporta" name="reporta" value={reportForm.reporta} onChange={handleReportChange} list="contactos-agenda" />
            <Input label="Teléfono" name="telefono" value={reportForm.telefono} onChange={handleReportChange} />
            <Input label="Correo Electrónico" name="email" type="email" value={reportForm.email} onChange={handleReportChange} placeholder="correo@ejemplo.com" />
            <TextArea label="Observaciones" name="observaciones" value={reportForm.observaciones} onChange={handleReportChange} rows={2} />
            <button onClick={() => setShowGenerateConfirm(true)} disabled={loadingReport} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl mt-8 shadow-xl hover:bg-green-700 active:scale-95 transition-all uppercase">{loadingReport ? 'Enviando...' : 'Generar Reporte'}</button>
          </div>
        );

      case 'contactos':
        return (
          <div className="flex flex-col bg-white border rounded-[2rem] overflow-hidden animate-fadeIn pb-20">
            <div className="p-5 bg-purple-50 border-b flex flex-col gap-3">
                <div className="flex justify-between items-center"><h3 className="font-black text-purple-900 tracking-tight uppercase">Agenda</h3>{!showAddContactForm && (<button onClick={() => setShowAddContactForm(true)} className="bg-purple-600 text-white text-[10px] font-black py-2 px-5 rounded-full shadow-lg active:scale-90 transition-all uppercase">Nuevo+</button>)}</div>
                {showAddContactForm && (
                  <div className="bg-white p-5 rounded-3xl border border-purple-200 shadow-xl animate-slideDown max-h-[500px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 text-left uppercase">
                      <h4 className="text-[10px] font-black text-purple-700">Registro Clínico</h4>
                      <button onClick={() => setShowAddContactForm(false)}>✕</button>
                    </div>
                    <div className="space-y-4">
                        <Input label="Nombre Completo" placeholder="NOMBRE" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                        <Input label="Teléfono" placeholder="TELÉFONO" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                        <Input label="Hospital / Unidad" placeholder="HOSPITAL" value={newContact.unit} onChange={e => setNewContact({...newContact, unit: e.target.value})} />
                        <Input label="Correo Electrónico" placeholder="EMAIL" type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                        <button 
                          onClick={handleSaveContact} 
                          className="w-full bg-purple-600 text-white font-black py-4 rounded-xl uppercase shadow-md active:scale-95 transition-all"
                        >
                          Guardar Contacto
                        </button>
                    </div>
                  </div>
                )}
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-4 min-h-[400px]">{contacts.map(c => (<div key={c.id} className="p-5 border-l-[10px] border-l-purple-500 border rounded-[1.5rem] bg-gray-50 text-left group shadow-sm"><p className="font-black text-gray-800 text-sm uppercase">{c.name}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{c.client}</p><div className="flex justify-between items-center mt-2"><p className="text-xs font-black text-purple-700 font-mono">📞 {c.phone}</p><button onClick={() => deleteContact(c.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button></div></div>))}</div>
          </div>
        );

      case 'materialApoyo':
        if (documentationSubScreen === 'SPAREPARTS') {
          if (currentSparePartView) {
            return (
              <div className="flex flex-col bg-white border rounded-[2rem] overflow-hidden animate-fadeIn pb-20">
                <div className="p-5 bg-indigo-50 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <button onClick={() => setCurrentSparePartView(null)} className="mr-4 w-8 h-8 flex items-center justify-center bg-white rounded-lg text-indigo-600 shadow-sm">←</button>
                    <h3 className="font-black text-indigo-900 tracking-tight uppercase text-xs">Refacciones: {currentSparePartView}</h3>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2 min-h-[400px]">
                  {loadingSpares ? <div className="text-center p-20 animate-pulse text-indigo-300 font-black">Cargando catálogo...</div> : (
                    <table className="w-full text-[9px] text-left border-collapse">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {sparePartsData[0] && Object.keys(sparePartsData[0]).map(k => (
                            <th key={k} className="p-2 border-b font-black text-gray-400 uppercase tracking-tighter">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sparePartsData.map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-50 transition-colors">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="p-2 align-middle">
                                {typeof val === 'string' && val.includes('drive.google.com') ? (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-gray-700 font-medium">{val.split('https://')[0]}</span>
                                    <div className="relative group w-16 h-16">
                                      {(() => {
                                        const idMatch = val.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                        const driveId = idMatch ? idMatch[1] : null;
                                        return driveId ? (
                                          <img 
                                            src={`https://googleusercontent.com/profile/picture/6${driveId}=w400`} 
                                            className="h-full w-full object-cover rounded-lg border shadow-sm group-hover:scale-[2.5] group-hover:z-50 transition-transform cursor-pointer bg-white" 
                                            alt="Refacción"
                                            onError={(e) => {
                                              if (!e.target.dataset.triedBackup) {
                                                e.target.dataset.triedBackup = "true";
                                                e.target.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
                                              } else {
                                                e.target.src = 'https://placehold.co/100x100?text=Error+Carga';
                                              }
                                            }}
                                            onClick={() => window.open(val.match(/https:\/\/[^\s]+/)?.[0], '_blank')} 
                                          />
                                          ) : <span className="text-red-400">ID no encontrado</span>;
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-700 font-medium">{val}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div className="p-6 bg-white border rounded-[2rem] animate-fadeIn pb-20">
               <button onClick={() => setDocumentationSubScreen(null)} className="mb-8 flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-widest"><span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">←</span> Volver</button>
               <div className="grid gap-4">
                 <button onClick={() => fetchSpareParts('https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=1919791847&single=true&output=csv', 'COMPOGUARD')} className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] font-black text-indigo-700 hover:bg-indigo-100 transition-all flex flex-col items-center gap-2 shadow-sm">
                   <span className="text-3xl">⚖️</span> COMPOGUARD
                 </button>
                 <button onClick={() => fetchSpareParts('https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=1546674811&single=true&output=csv', 'COMPOMAT G5')} className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] font-black text-indigo-700 hover:bg-indigo-100 transition-all flex flex-col items-center gap-2 shadow-sm">
                   <span className="text-3xl">🗜️</span> COMPOMAT G5
                 </button>
               </div>
            </div>
          );
        }

        const docLinks = {
          'AMICUS': [
            { t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/138n35pCNjruPm8z3rDk7sMwA3k_gKrml/view?usp=drive_link' },
            { t: 'Manual de Usuario', l: 'https://drive.google.com/file/d/1c8SfUfoQj4-S2drwPnu_oaQ27dokE5vB/view?usp=drive_link' },
            { t: 'Refacciones (Drive)', l: 'https://drive.google.com/file/d/1cU2WsOrFLMKeJWace-BmuILhGAGsaZdS/view?usp=drive_link' }
          ],
          'AMICORE': [
            { t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1SRK9tx68JT3OSvjboQWkIqnKVvKVU0Kx/view?usp=drive_link' },
            { t: 'Manual de Usuario', l: 'https://drive.google.com/file/d/1YXtiWsgCIo95uaS6oPMfkPTqu_avXCc0/view?usp=drive_link' }
          ],
          'ALYX': [
            { t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1EbFMtnovi4Qs-D_Kk9LOa2sq74rFB6Hr/view?usp=drive_link' },
            { t: 'Guía Alyx Service Software', l: 'https://drive.google.com/file/d/1zOIT89IvMo2kAKUf7ZJWn8F6-Y1f_bJR/view?usp=drive_link' }
          ],
          'COMPOMAT G5': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1Rzm1Iso5UIv3zVc4ue6ml0Xv2cJ1bkS5/view?usp=drive_link' }],
          'COMPOGUARD': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1QWjsUoxtVbh49-rUUXhGXrRrNwt3_5F0/view?usp=drive_link' }],
          'COMPOSEAL': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1DPSHF4bVJTLGn2or6DaDBQRsTi5hkxwC/view?usp=drive_link' }],
          'COMPODOCK': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1J4I1RhEpE3SGb1jclwoRtHwubTA8zbPE/view?usp=drive_link' }]
        };

        if (documentationSubScreen && docLinks[documentationSubScreen]) {
          return (
            <div className="p-6 bg-white border rounded-[2rem] text-left animate-fadeIn shadow-sm pb-20">
              <button onClick={() => setDocumentationSubScreen(null)} className="mb-8 flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest"><span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">←</span> Volver</button>
              <h3 className="text-2xl font-black mb-6 tracking-tighter uppercase text-gray-800 border-b pb-4">{documentationSubScreen} Docs</h3>
              <div className="grid gap-3">
                {docLinks[documentationSubScreen].map(d => (
                  <button key={d.t} onClick={() => window.open(d.l, '_blank')} className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl font-black text-blue-900 text-left hover:bg-blue-100 transition-all flex items-center gap-4">
                    <span className="text-xl">📄</span>
                    <span className="text-[11px] uppercase tracking-tighter leading-tight">{d.t}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className="p-2 flex flex-col animate-fadeIn pb-20">
            <div className="grid grid-cols-2 gap-3 pb-10">
              {Object.keys(docLinks).map(k => (
                <button key={k} onClick={() => setDocumentationSubScreen(k)} className="p-6 bg-white border-2 border-gray-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-sm hover:border-blue-500 transition-all flex flex-col items-center gap-3 active:scale-95">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  {k}
                </button>
              ))}
              <button onClick={() => setDocumentationSubScreen('SPAREPARTS')} className="p-6 bg-indigo-600 border-2 border-indigo-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-indigo-700 transition-all flex flex-col items-center gap-3 col-span-2 active:scale-95">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                🛠️ SPARE PARTS HUB
              </button>
            </div>
          </div>
        );

      case 'ordenesAsignadas':
        const myOrders = sheetOrders.filter(so => so.engineerName === loginForm.engineerName);
        
        if (selectedOrderDetails) {
          const so = selectedOrderDetails;
          return (
            <div className="flex flex-col bg-white border rounded-[2rem] overflow-hidden animate-fadeIn pb-20 shadow-sm text-left">
              <div className="p-5 bg-blue-50 border-b flex items-center">
                <button onClick={() => setSelectedOrderDetails(null)} className="mr-4 w-8 h-8 flex items-center justify-center bg-white rounded-lg text-blue-600 shadow-sm">←</button>
                <h3 className="font-black text-blue-900 tracking-tight uppercase text-xs">Detalle de Orden</h3>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto min-h-[500px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Servicio</p>
                    <p className="text-xl font-black text-gray-800 tracking-tighter">{so.tipoOS}</p>
                  </div>
                  <span className={`text-[10px] font-black px-4 py-2 rounded-xl shadow-sm ${(so.status && so.status.toLowerCase().includes('abierto')) ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {so.status ? (so.status.toLowerCase().includes('abierto') ? 'ABIERTO' : 'CERRADO') : 'ABIERTO'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Serie / SN</p>
                    <p className="text-xs font-black text-gray-700">{so.serie}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Modelo</p>
                    <p className="text-xs font-black text-gray-700">{so.modelo || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Descripción</p>
                    <p className="text-xs font-black text-gray-700">{so.descripcionEquipo || so.descripcion || 'No especificada'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Hospital / Unidad</p>
                  <p className="text-xs font-black text-gray-800">{so.cliente}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Falla Reportada</p>
                  <p className="text-[11px] font-bold text-gray-700 leading-relaxed italic">"{so.falla}"</p>
                  {so.descripcionFalla && (
                    <p className="mt-2 text-[10px] font-black text-blue-600">Cat: {so.codigoFalla} - {so.descripcionFalla}</p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Datos de Contacto</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">👤</span>
                    <p className="text-[11px] font-bold text-gray-700">{so.reporta || 'No especificado'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">📞</span>
                    <p className="text-[11px] font-bold text-blue-600 font-mono">{so.telefono || 'Sin teléfono'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">✉️</span>
                    <p className="text-[10px] font-bold text-gray-500">{so.email || 'Sin correo'}</p>
                  </div>
                </div>

                {so.observaciones && (
                  <div className="border-t pt-4">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Observaciones</p>
                    <p className="text-[10px] font-bold text-gray-600 leading-tight">{so.observaciones}</p>
                  </div>
                )}

                <div className="border-t pt-4 text-center">
                  <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Generado el {so.createdAt ? so.createdAt : 'Desconocido'}</p>
                </div>

                {(so.status && so.status.toLowerCase().includes('abierto')) && (
                  <div className="pt-6">
                    <button 
                      onClick={() => closeOrder(so)}
                      disabled={closingOrder}
                      className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all uppercase flex items-center justify-center gap-2"
                    >
                      {closingOrder ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          PROCESANDO...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Cerrar Orden
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col bg-white border rounded-[2rem] overflow-hidden animate-fadeIn pb-20">
            <div className="p-5 bg-blue-50 border-b"><h3 className="font-black text-blue-900 tracking-tight uppercase">Historial de Órdenes</h3></div>
            <div className="flex-1 overflow-auto p-5 space-y-4 min-h-[400px]">
              {myOrders.length > 0 ? myOrders.map(so => (
                <div 
                  key={so.id} 
                  onClick={() => setSelectedOrderDetails(so)}
                  className="p-5 border-l-[10px] border-l-blue-500 border rounded-[1.5rem] bg-gray-50 text-left relative shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:bg-white border-2 border-transparent hover:border-blue-100"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-black text-blue-600 text-sm">{so.tipoOS}</p>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-lg shadow-sm ${(so.status && so.status.toLowerCase().includes('abierto')) ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {so.status ? (so.status.toLowerCase().includes('abierto') ? 'ABIERTO' : 'CERRADO') : 'ABIERTO'}
                    </span>
                  </div>
                  <p className="font-black text-gray-800 text-[10px] mt-2">{so.serie} - {so.modelo || 'EQUIPO'}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tight truncate max-w-[200px]">{so.cliente}</p>
                  <div className="mt-4 flex justify-end">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Ver Detalles →</span>
                  </div>
                </div>
              )) : <div className="p-10 text-center font-bold text-gray-300 uppercase tracking-widest text-[10px]">Sin órdenes registradas</div>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full relative h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b-2 border-gray-50 pb-5">
        {menuSubScreen === 'dashboard' ? (
          <div className="flex flex-col text-left"><span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Bienvenido</span><h2 className="font-black text-gray-800 tracking-tighter uppercase text-xl leading-none">Ing. {loginForm.engineerName.split(' ')[2] || loginForm.engineerName.split(' ')[1]}</h2></div>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSmartBack} 
              className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black flex items-center justify-center shadow-sm active:scale-90 transition-all"
            >
              ←
            </button>
            <h2 className="font-black uppercase text-[10px] tracking-widest text-gray-300">{menuSubScreen}</h2>
          </div>
        )}
        {menuSubScreen === 'dashboard' && (<button onClick={() => setScreen('landing')} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl active:bg-red-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></button>)}
      </div>
      <div className="flex-1 overflow-y-auto scroll-smooth pb-10">{menuSubScreen === 'dashboard' ? (<div className="grid gap-5 animate-fadeIn"><MenuButton label="Inventario" subScreenId="equipos" svgIcon={<EquiposSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} /><MenuButton label="Reportes" subScreenId="reporteEquipos" svgIcon={<ReporteEquiposSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} /><MenuButton label="Material" subScreenId="materialApoyo" svgIcon={<MaterialApoyoSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} /><MenuButton label="Agenda" subScreenId="contactos" svgIcon={<ContactosSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} /></div>) : renderContent()}</div>
      
      {showResetOSConfirm && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm"><div className="bg-white p-10 rounded-[2.5rem] w-full max-w-xs text-center shadow-2xl animate-popIn"><h3 className="font-black text-2xl mb-4 uppercase text-gray-800">Nueva Orden</h3><p className="text-sm text-gray-400 mb-8 font-bold leading-relaxed">¿Deseas vaciar los campos?</p><div className="flex flex-col gap-3"><button onClick={() => { resetOSForm(); setShowResetOSConfirm(false); setMenuSubScreen('generarOS'); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">LIMPIAR</button><button onClick={() => { setShowResetOSConfirm(false); setMenuSubScreen('generarOS'); }} className="w-full py-4 bg-gray-100 text-gray-800 rounded-2xl font-black">MANTENER</button></div></div></div>)}
      {selectedEquipment && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm"><div className="bg-white p-10 rounded-[2.5rem] w-full max-w-xs text-center shadow-2xl animate-popIn"><h3 className="font-black text-xl mb-4 uppercase text-gray-800">Reportar Equipo</h3><p className="text-sm text-gray-400 mb-8 font-bold leading-relaxed">¿Reportar serie <span className="text-blue-600 font-black">{selectedEquipment.serie}</span>?</p><div className="flex gap-4"><button onClick={() => setSelectedEquipment(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-gray-500">NO</button><button onClick={() => { setReportForm({ ...reportForm, serie: selectedEquipment.serie, modelo: selectedEquipment.modelo || '', descripcionEquipo: selectedEquipment.descripcion || '', cliente: selectedEquipment.cliente || '' }); setSelectedEquipment(null); setMenuSubScreen('generarOS'); }} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">SÍ</button></div></div></div>)}
      {showGenerateConfirm && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm"><div className="bg-white p-10 rounded-[2.5rem] w-full max-w-xs text-center shadow-2xl animate-popIn"><h3 className="font-black text-2xl mb-4 text-green-600 uppercase">Confirmar</h3><p className="text-sm text-gray-400 mb-8 font-bold leading-relaxed">La información se enviará a la nube.</p><div className="flex gap-4"><button onClick={() => setShowGenerateConfirm(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-gray-500">CERRAR</button><button onClick={() => { setShowGenerateConfirm(false); submitReport(); }} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black">ENVIAR</button></div></div></div>)}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('landing');
  const [menuSubScreen, setMenuSubScreen] = useState('dashboard'); 
  const [documentationSubScreen, setDocumentationSubScreen] = useState(null);
  const [currentSparePartView, setCurrentSparePartView] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [sheetOrders, setSheetOrders] = useState([]); 
  const [registerForm, setRegisterForm] = useState({ engineerName: '', phone: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ engineerName: '', password: '' });

  // --- CONFIGURACIÓN DE ICONO Y PWA PARA EL CELULAR ---
  useEffect(() => {
    document.title = "Fresenius Hub";
    const iconUrl = "https://lh3.googleusercontent.com/d/1xl3VUyb0n-2wDlaBO06KRamI13PuWX8z";

    // Cambiar Favicon estándar
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = iconUrl;

    // Cambiar icono para dispositivos Apple/iOS
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) { appleLink = document.createElement('link'); appleLink.rel = 'apple-touch-icon'; document.head.appendChild(appleLink); }
    appleLink.href = iconUrl;

    // Forzar Manifest para que Android lo detecte al añadir a la pantalla de inicio
    const manifest = {
      name: "Fresenius Engineering Hub",
      short_name: "Fresenius",
      start_url: "/",
      display: "standalone",
      background_color: "#f1f5f9",
      theme_color: "#2563eb",
      icons: [{ src: iconUrl, sizes: "192x192 512x512", type: "image/png", purpose: "any maskable" }]
    };
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    let manifestLink = document.querySelector("link[rel='manifest']");
    if (!manifestLink) { manifestLink = document.createElement('link'); manifestLink.rel = 'manifest'; document.head.appendChild(manifestLink); }
    manifestLink.href = URL.createObjectURL(manifestBlob);
  }, []);

  // --- FUNCIÓN DE NAVEGACIÓN GLOBAL ---
  const navigate = (s, ms = 'dashboard', ds = null, csv = null) => {
    setScreen(s);
    setMenuSubScreen(ms);
    setDocumentationSubScreen(ds);
    setCurrentSparePartView(csv);
    
    window.history.pushState({ 
      screen: s, 
      menuSub: ms, 
      docSub: ds, 
      spareView: csv 
    }, '');
  };

  const handleScreenChange = (newScreen) => {
    if (newScreen === 'register') {
      setRegisterForm({ engineerName: '', phone: '', email: '', password: '' });
    } else if (newScreen === 'login') {
      setLoginForm({ engineerName: '', password: '' });
    } else if (newScreen === 'landing') {
      setLoginForm({ engineerName: '', password: '' });
      setRegisterForm({ engineerName: '', phone: '', email: '', password: '' });
    }
    navigate(newScreen);
  };

  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => {
        setError('');
        setMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  // --- CONTROL DEL BOTÓN ATRÁS ---
  useEffect(() => {
    window.history.replaceState({ screen: 'landing', menuSub: 'dashboard', docSub: null, spareView: null }, '');

    const handlePopState = (event) => {
      if (event.state) {
        const { screen, menuSub, docSub, spareView } = event.state;
        setScreen(screen);
        setMenuSubScreen(menuSub);
        setDocumentationSubScreen(docSub || null);
        setCurrentSparePartView(spareView || null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { 
          await signInWithCustomToken(auth, __initial_auth_token); 
        } else { 
          await signInAnonymously(auth); 
        }
      } catch (e) { console.error("Error de autenticación", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const resp = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=0&single=true&output=csv');
        const text = await resp.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const data = rows.slice(1).filter(r => r.trim()).map((row, idx) => {
          const vals = []; let curr = '', inQ = false;
          for (let c of row) { if(c === '"') inQ = !inQ; else if(c === ',' && !inQ) { vals.push(curr.trim().replace(/^"|"$/g, '')); curr = ''; } else curr += c; }
          vals.push(curr.trim().replace(/^"|"$/g, ''));
          const obj = { id: idx };
          headers.forEach((h, i) => { 
            const v = vals[i] || ''; 
            if(h.includes('serie')) obj.serie = v; 
            if(h.includes('modelo')) obj.modelo = v; 
            if(h.includes('descripc')) obj.descripcion = v; 
            if(h.includes('cliente')) obj.cliente = v; 
            if(h.includes('responsable')) obj.responsable = v; 
          });
          return obj;
        });
        setEquipment(data);
      } catch (e) { console.error("Error al obtener equipo", e); }
    };
    fetchEquipment();
  }, []);

  useEffect(() => {
    const fetchSheetOrders = async () => {
      try {
        const resp = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRqMsPTihy-C9WpValwIav8qpZMi7r710R3M3cOPakcgQ2kEhMJVl1Mw4UlKSt8yB6J2EP_wU5tcm3A/pub?gid=0&single=true&output=csv');
        const text = await resp.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const data = rows.slice(1).filter(r => r.trim()).map((row, idx) => {
          const vals = []; let curr = '', inQ = false;
          for (let c of row) { if(c === '"') inQ = !inQ; else if(c === ',' && !inQ) { vals.push(curr.trim().replace(/^"|"$/g, '')); curr = ''; } else curr += c; }
          vals.push(curr.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, i) => { 
            const v = vals[i] || ''; 
            if(h.includes('estatus') || h.includes('status')) obj.status = v || 'Abierto';
            else if(h.includes('serie')) obj.serie = v; 
            else if(h.includes('modelo')) obj.modelo = v; 
            else if(h.includes('cliente') || h.includes('hospital')) obj.cliente = v; 
            else if(h.includes('ingeniero')) obj.engineerName = v; 
            else if(h.includes('falla')) obj.falla = v; 
            else if(h.includes('tipo')) obj.tipoOS = v; 
            else if(h.includes('fecha')) obj.createdAt = v; 
            else if(h.includes('reporta') || h.includes('contacto')) obj.reporta = v; 
            else if(h.includes('telefono')) obj.telefono = v; 
            else if(h.includes('observaciones')) obj.observaciones = v; 
            else if(h.includes('firebase')) obj.id = v; 
          });
          if (!obj.id) obj.id = `sheet-${idx}`;
          return obj;
        });
        setSheetOrders(data);
      } catch (e) { console.error("Error al obtener órdenes de Sheets", e); }
    };
    if (user) {
        fetchSheetOrders();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubContacts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'contacts'), s => setContacts(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.error(e));
    const unsubOrders = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'service_orders'), s => setServiceOrders(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.error(e));
    return () => { unsubContacts(); unsubOrders(); };
  }, [user]);

  const loginEngineer = async () => {
    if (!loginForm.engineerName || !loginForm.password) { setError("INGRESE PIN."); return; }
    setLoading(true);
    try {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'engineers');
      const s = await getDocs(q);
      const found = s.docs.find(d => d.data().engineerName === loginForm.engineerName && d.data().password === loginForm.password);
      if (!found) { 
        setError("PIN INCORRECTO."); 
        setLoading(false); 
        return; 
      }
      setError(''); 
      navigate('menu');
    } catch (e) { setError("Error."); } finally { setLoading(false); }
  };

  const registerEngineer = async () => {
    if (!registerForm.engineerName || !registerForm.phone || !registerForm.email || !registerForm.password) { 
      setError("TODOS LOS CAMPOS SON OBLIGATORIOS."); 
      return; 
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setError("CORREO ELECTRÓNICO INVÁLIDO.");
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(registerForm.phone)) {
      setError("EL TELÉFONO DEBE TENER EXACTAMENTE 10 DÍGITOS.");
      return;
    }

    if (registerForm.password.length < 4) {
      setError("EL PIN DEBE TENER AL MENOS 4 CARACTERES.");
      return;
    }

    setLoading(true);
    try {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'engineers');
      const s = await getDocs(q);
      const found = s.docs.find(d => d.data().engineerName === registerForm.engineerName);
      
      if (found) {
        setError("EL INGENIERO YA ESTÁ REGISTRADO.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'engineers'), { ...registerForm, createdAt: new Date().toISOString() });
      handleScreenChange('login');
    } catch (e) { setError("Error."); } finally { setLoading(false); }
  };

  if (loading) return (<div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-blue-600 font-black gap-4"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><div className="animate-pulse tracking-widest text-xs font-black">Fresenius Hub...</div></div>);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-[420px] bg-white p-7 rounded-[4rem] shadow-2xl border-8 border-white relative min-h-[850px] max-h-[95vh] flex flex-col">
        <div className="absolute top-8 left-0 right-0 px-8 z-50 pointer-events-none text-center">
          {error && <div className="bg-red-500 text-white p-4 text-[10px] rounded-2xl mb-2 font-black shadow-lg animate-popIn uppercase tracking-widest">{error}</div>}
          {message && screen !== 'menu' && <div className="bg-green-500 text-white p-4 text-[10px] rounded-2xl mb-2 font-black shadow-lg animate-popIn uppercase tracking-widest">{message}</div>}
        </div>
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {screen === 'landing' && <LandingScreen setScreen={handleScreenChange} />}
          {screen === 'register' && <RegisterScreen form={registerForm} onChange={e => setRegisterForm({...registerForm, [e.target.name]: e.target.value})} onSubmit={registerEngineer} loading={loading} setScreen={handleScreenChange} />}
          {screen === 'login' && <LoginScreen form={loginForm} onChange={e => setLoginForm({...loginForm, [e.target.name]: e.target.value})} onSubmit={loginEngineer} loading={loading} setScreen={handleScreenChange} />}
          {screen === 'menu' && (
            <MenuScreen 
              menuSubScreen={menuSubScreen} setMenuSubScreen={(val) => navigate('menu', val)} 
              loginForm={loginForm} setScreen={handleScreenChange} setMessage={setMessage} setError={setError} userId={user?.uid} db={db} contacts={contacts} 
              addContact={c => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'contacts'), {...c, addedBy: user?.uid})} 
              deleteContact={id => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'contacts', id))} serviceOrders={serviceOrders} sheetOrders={sheetOrders} setSheetOrders={setSheetOrders} equipment={equipment} 
              documentationSubScreen={documentationSubScreen} setDocumentationSubScreen={(val) => navigate('menu', menuSubScreen === 'materialApoyo' ? 'materialApoyo' : menuSubScreen, val)}
              currentSparePartView={currentSparePartView} setCurrentSparePartView={(val) => navigate('menu', 'materialApoyo', 'SPAREPARTS', val)}
            />
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 text-center flex justify-center items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div><p className="text-[7px] font-black text-gray-300 tracking-[0.4em] uppercase">FRESENIUS KABI • Engineering Hub 2026</p></div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { max-height: 0; opacity: 0; } to { max-height: 1000px; opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideDown { animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-popIn { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        input:focus, textarea:focus { scroll-margin-bottom: 20px; }
      `}</style>
    </div>
  );
}